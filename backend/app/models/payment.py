from sqlalchemy import Column, String, Integer, Float, DateTime, Enum, Text
from datetime import datetime
from app.database import Base
import enum

class PaymentStatusEnum(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentMethodEnum(str, enum.Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"
    CARD = "card"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, index=True)
    stripe_payment_intent_id = Column(String, unique=True, nullable=True)
    amount = Column(Float)
    currency = Column(String, default="USD")
    status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.PENDING)
    payment_method = Column(Enum(PaymentMethodEnum), default=PaymentMethodEnum.STRIPE)

    customer_email = Column(String)
    receipt_url = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
