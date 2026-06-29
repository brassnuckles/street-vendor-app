from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.models import Favorite, Product
from app.routers.auth import get_current_customer

router = APIRouter()

class FavoriteResponse:
    def __init__(self, id: int, product_id: int, created_at: str):
        self.id = id
        self.product_id = product_id
        self.created_at = created_at

@router.post("/{product_id}")
def add_favorite(
    product_id: int,
    current_customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Add product to favorites"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    existing = db.query(Favorite).filter(
        and_(
            Favorite.product_id == product_id,
            Favorite.customer_id == current_customer.id
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product already in favorites"
        )

    favorite = Favorite(
        customer_id=current_customer.id,
        product_id=product_id
    )
    db.add(favorite)
    db.commit()
    db.refresh(favorite)

    return {
        "id": favorite.id,
        "product_id": favorite.product_id,
        "created_at": favorite.created_at.isoformat()
    }

@router.delete("/{product_id}")
def remove_favorite(
    product_id: int,
    current_customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Remove product from favorites"""
    favorite = db.query(Favorite).filter(
        and_(
            Favorite.product_id == product_id,
            Favorite.customer_id == current_customer.id
        )
    ).first()

    if not favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not in favorites")

    db.delete(favorite)
    db.commit()
    return {"message": "Removed from favorites"}

@router.get("")
def get_favorites(
    current_customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get customer's favorite products"""
    favorites = db.query(Favorite).filter(
        Favorite.customer_id == current_customer.id
    ).all()

    product_ids = [f.product_id for f in favorites]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()

    return products

@router.get("/{product_id}/is-favorite")
def is_favorite(
    product_id: int,
    current_customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Check if product is in favorites"""
    favorite = db.query(Favorite).filter(
        and_(
            Favorite.product_id == product_id,
            Favorite.customer_id == current_customer.id
        )
    ).first()

    return {"is_favorite": favorite is not None}
