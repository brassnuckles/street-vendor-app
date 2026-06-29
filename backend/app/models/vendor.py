from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum

class VendorStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    password_hash = Column(String)
    business_name = Column(String, index=True)
    description = Column(Text, nullable=True)
    profile_image = Column(String, nullable=True)
    status = Column(Enum(VendorStatusEnum), default=VendorStatusEnum.ACTIVE)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String, nullable=True)

    stripe_account_id = Column(String, nullable=True)
    rating = Column(Float, default=5.0)
    total_reviews = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    products = relationship("Product", back_populates="vendor", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="vendor")
