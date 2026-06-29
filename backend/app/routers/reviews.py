from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Review, Product
from app.routers.auth import get_current_customer
from sqlalchemy import and_, func

router = APIRouter()

class ReviewCreate(BaseModel):
    product_id: int
    rating: float
    title: str
    comment: str = None

class ReviewResponse(BaseModel):
    id: int
    product_id: int
    customer_id: int
    rating: float
    title: str
    comment: str = None
    helpful_count: int
    created_at: str

    class Config:
        from_attributes = True

@router.post("", response_model=ReviewResponse)
def create_review(
    review: ReviewCreate,
    current_customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Create a review for a product"""
    product = db.query(Product).filter(Product.id == review.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    existing_review = db.query(Review).filter(
        and_(
            Review.product_id == review.product_id,
            Review.customer_id == current_customer.id
        )
    ).first()

    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this product"
        )

    db_review = Review(
        product_id=review.product_id,
        vendor_id=product.vendor_id,
        customer_id=current_customer.id,
        rating=review.rating,
        title=review.title,
        comment=review.comment
    )

    db.add(db_review)

    product_reviews = db.query(Review).filter(Review.product_id == review.product_id).all()
    avg_rating = sum(r.rating for r in product_reviews) / len(product_reviews) if product_reviews else 5.0

    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/product/{product_id}", response_model=list[ReviewResponse])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    """Get reviews for a product"""
    reviews = db.query(Review).filter(Review.product_id == product_id).order_by(Review.created_at.desc()).all()
    return reviews

@router.put("/{review_id}/helpful")
def mark_helpful(review_id: int, db: Session = Depends(get_db)):
    """Mark a review as helpful"""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    review.helpful_count += 1
    db.commit()
    return {"helpful_count": review.helpful_count}

@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    current_customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Delete own review"""
    review = db.query(Review).filter(
        and_(Review.id == review_id, Review.customer_id == current_customer.id)
    ).first()

    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    db.delete(review)
    db.commit()
    return {"message": "Review deleted"}
