from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Order, OrderItem, Product, Customer, Vendor
from app.schemas import OrderCreate, OrderResponse

router = APIRouter()

@router.post("", response_model=OrderResponse)
def create_order(customer_id: int, order: OrderCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    vendor = db.query(Vendor).filter(Vendor.id == order.vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")

    total_amount = 0
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {item.product_id} not found")
        if product.quantity_available < item.quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient stock for {product.name}")
        total_amount += product.price * item.quantity

    db_order = Order(
        customer_id=customer_id,
        vendor_id=order.vendor_id,
        total_amount=total_amount,
        delivery_address=order.delivery_address,
        customer_notes=order.customer_notes
    )
    db.add(db_order)
    db.flush()

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        db_order_item = OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=product.price
        )
        db.add(db_order_item)
        product.quantity_available -= item.quantity

    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order

@router.get("/customer/{customer_id}", response_model=list[OrderResponse])
def get_customer_orders(customer_id: int, skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.customer_id == customer_id).offset(skip).limit(limit).all()
    return orders

@router.get("/vendor/{vendor_id}", response_model=list[OrderResponse])
def get_vendor_orders(vendor_id: int, skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.vendor_id == vendor_id).offset(skip).limit(limit).all()
    return orders

@router.put("/{order_id}/status")
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = status
    db.commit()
    db.refresh(order)
    return order
