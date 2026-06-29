from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.database import get_db
from app.models import Vendor, Customer, Order, Product, Review, Notification
from datetime import datetime, timedelta

router = APIRouter()

class AdminUser(BaseModel):
    is_admin: bool = False

def get_current_admin(db: Session = Depends()):
    """Check if user is admin - TODO: Implement proper admin authentication"""
    return {"is_admin": True}

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    total_vendors = db.query(Vendor).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()
    total_products = db.query(Product).count()

    last_7_days = datetime.utcnow() - timedelta(days=7)
    recent_orders = db.query(Order).filter(Order.created_at >= last_7_days).count()

    revenue_data = db.query(
        func.sum(Order.total_amount)
    ).filter(Order.created_at >= last_7_days).scalar() or 0

    avg_order_value = db.query(
        func.avg(Order.total_amount)
    ).scalar() or 0

    return {
        "total_vendors": total_vendors,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "total_products": total_products,
        "recent_orders_7d": recent_orders,
        "revenue_7d": float(revenue_data),
        "avg_order_value": float(avg_order_value)
    }

@router.get("/vendors")
def list_vendors_admin(
    skip: int = Query(0),
    limit: int = Query(10),
    status: str = Query(None),
    db: Session = Depends(get_db)
):
    """Get all vendors with filtering"""
    query = db.query(Vendor)

    if status:
        query = query.filter(Vendor.status == status)

    total = query.count()
    vendors = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "vendors": vendors
    }

@router.put("/vendors/{vendor_id}/status")
def update_vendor_status(
    vendor_id: int,
    new_status: str,
    db: Session = Depends(get_db)
):
    """Update vendor status (ACTIVE, INACTIVE, SUSPENDED)"""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")

    vendor.status = new_status
    db.commit()

    Notification.create(
        user_id=vendor_id,
        user_type="vendor",
        title="Account Status Changed",
        body=f"Your account status has been changed to {new_status}",
        db=db
    )

    return {"vendor_id": vendor_id, "new_status": new_status}

@router.delete("/vendors/{vendor_id}")
def remove_vendor(vendor_id: int, db: Session = Depends(get_db)):
    """Remove vendor and all associated data"""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")

    db.delete(vendor)
    db.commit()

    return {"message": f"Vendor {vendor_id} removed"}

@router.get("/orders")
def list_orders_admin(
    skip: int = Query(0),
    limit: int = Query(10),
    status: str = Query(None),
    db: Session = Depends(get_db)
):
    """Get all orders with filtering"""
    query = db.query(Order)

    if status:
        query = query.filter(Order.status == status)

    total = query.count()
    orders = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "orders": orders
    }

@router.get("/products")
def list_products_admin(
    skip: int = Query(0),
    limit: int = Query(10),
    vendor_id: int = Query(None),
    db: Session = Depends(get_db)
):
    """Get all products with filtering"""
    query = db.query(Product)

    if vendor_id:
        query = query.filter(Product.vendor_id == vendor_id)

    total = query.count()
    products = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "products": products
    }

@router.delete("/products/{product_id}")
def remove_product(product_id: int, db: Session = Depends(get_db)):
    """Remove inappropriate product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    vendor_id = product.vendor_id
    db.delete(product)
    db.commit()

    Notification.create(
        user_id=vendor_id,
        user_type="vendor",
        title="Product Removed",
        body=f"Your product '{product.name}' has been removed due to policy violation",
        db=db
    )

    return {"message": f"Product {product_id} removed"}

@router.get("/reports")
def get_reports(
    report_type: str = Query("overview"),
    start_date: datetime = Query(None),
    end_date: datetime = Query(None),
    db: Session = Depends(get_db)
):
    """Get various reports"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()

    if report_type == "revenue":
        daily_revenue = db.query(
            func.date(Order.created_at).label('date'),
            func.sum(Order.total_amount).label('amount')
        ).filter(
            Order.created_at.between(start_date, end_date)
        ).group_by(func.date(Order.created_at)).all()

        return {"type": "revenue", "data": daily_revenue}

    elif report_type == "top_vendors":
        top_vendors = db.query(
            Vendor.business_name,
            func.count(Order.id).label('order_count'),
            func.sum(Order.total_amount).label('revenue')
        ).join(Order, Vendor.id == Order.vendor_id).filter(
            Order.created_at.between(start_date, end_date)
        ).group_by(Vendor.id).order_by(
            func.sum(Order.total_amount).desc()
        ).limit(10).all()

        return {"type": "top_vendors", "data": top_vendors}

    elif report_type == "top_products":
        top_products = db.query(
            Product.name,
            func.sum(Product.quantity_available).label('stock'),
            func.avg(Review.rating).label('avg_rating')
        ).outerjoin(Review, Product.id == Review.product_id).group_by(
            Product.id
        ).order_by(func.avg(Review.rating).desc()).limit(10).all()

        return {"type": "top_products", "data": top_products}

    else:
        return {
            "type": "overview",
            "total_orders": db.query(Order).filter(Order.created_at.between(start_date, end_date)).count(),
            "total_revenue": db.query(func.sum(Order.total_amount)).filter(Order.created_at.between(start_date, end_date)).scalar() or 0
        }

@router.post("/send-notification")
def send_notification(
    user_id: int,
    user_type: str,
    title: str,
    body: str,
    db: Session = Depends(get_db)
):
    """Send notification to user"""
    from app.notifications import NotificationService

    success = NotificationService.send_push_notification(
        user_id=user_id,
        user_type=user_type,
        title=title,
        body=body,
        db=db
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to send notification")

    return {"message": "Notification sent"}

@router.get("/activity-log")
def get_activity_log(
    skip: int = Query(0),
    limit: int = Query(20),
    db: Session = Depends(get_db)
):
    """Get recent activity log"""
    orders = db.query(Order).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    activity = []
    for order in orders:
        activity.append({
            "type": "order_created",
            "timestamp": order.created_at,
            "details": f"Order #{order.id} from customer {order.customer_id}"
        })

    return activity
