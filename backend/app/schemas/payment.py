from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaymentCreate(BaseModel):
    order_id: str
    amount: float
    currency: str = "USD"
    customer_email: str

class PaymentResponse(BaseModel):
    id: int
    order_id: str
    stripe_payment_intent_id: Optional[str]
    amount: float
    currency: str
    status: str
    payment_method: str
    customer_email: str
    receipt_url: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaymentWebhook(BaseModel):
    type: str
    data: dict
