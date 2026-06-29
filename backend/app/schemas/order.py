from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    vendor_id: int
    items: List[OrderItemCreate]
    delivery_address: Optional[str] = None
    customer_notes: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    vendor_id: int
    status: str
    total_amount: float
    currency: str
    payment_id: Optional[str]
    delivery_address: Optional[str]
    customer_notes: Optional[str]
    items: List[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
