from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class VendorRegister(BaseModel):
    email: EmailStr
    password: str
    business_name: str
    phone: str
    description: Optional[str] = None

class VendorLogin(BaseModel):
    email: EmailStr
    password: str

class VendorUpdate(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None

class VendorResponse(BaseModel):
    id: int
    email: str
    business_name: str
    phone: str
    description: Optional[str]
    profile_image: Optional[str]
    status: str
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    rating: float
    total_reviews: int
    created_at: datetime

    class Config:
        from_attributes = True
