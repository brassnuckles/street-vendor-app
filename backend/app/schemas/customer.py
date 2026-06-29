from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class CustomerRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

class CustomerLogin(BaseModel):
    email: EmailStr
    password: str

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None

class CustomerResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    profile_image: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
