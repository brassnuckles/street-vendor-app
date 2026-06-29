from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from datetime import datetime
from app.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), index=True)
    rating = Column(Float)
    title = Column(String)
    comment = Column(Text, nullable=True)
    images = Column(String, nullable=True)
    helpful_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
