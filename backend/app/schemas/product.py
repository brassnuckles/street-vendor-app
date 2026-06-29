from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    price: float
    quantity_available: int = 0
    images: Optional[List[str]] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    quantity_available: Optional[int] = None
    is_available: Optional[bool] = None
    images: Optional[List[str]] = None

class ProductResponse(BaseModel):
    id: int
    vendor_id: int
    name: str
    description: Optional[str]
    category: str
    price: float
    currency: str
    quantity_available: int
    images: List[str]
    is_available: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
