from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Product, Vendor
from app.schemas import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()

@router.post("", response_model=ProductResponse)
def create_product(vendor_id: int, product: ProductCreate, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")

    db_product = Product(
        vendor_id=vendor_id,
        name=product.name,
        description=product.description,
        category=product.category,
        price=product.price,
        quantity_available=product.quantity_available,
        images=product.images or []
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}

@router.get("/vendor/{vendor_id}", response_model=list[ProductResponse])
def list_vendor_products(vendor_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.vendor_id == vendor_id).offset(skip).limit(limit).all()
    return products

@router.get("", response_model=list[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 20,
    category: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_available == True)

    if category:
        query = query.filter(Product.category == category)

    return query.offset(skip).limit(limit).all()
