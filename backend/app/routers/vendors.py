from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.database import get_db
from app.models import Vendor
from app.schemas import VendorRegister, VendorLogin, VendorUpdate, VendorResponse

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

@router.post("/register", response_model=VendorResponse)
def register_vendor(vendor: VendorRegister, db: Session = Depends(get_db)):
    existing = db.query(Vendor).filter(Vendor.email == vendor.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    db_vendor = Vendor(
        email=vendor.email,
        password_hash=hash_password(vendor.password),
        business_name=vendor.business_name,
        phone=vendor.phone,
        description=vendor.description
    )
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@router.post("/login")
def login_vendor(vendor: VendorLogin, db: Session = Depends(get_db)):
    db_vendor = db.query(Vendor).filter(Vendor.email == vendor.email).first()
    if not db_vendor or not verify_password(vendor.password, db_vendor.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return {
        "id": db_vendor.id,
        "email": db_vendor.email,
        "business_name": db_vendor.business_name,
        "access_token": "temp-token",
        "token_type": "bearer"
    }

@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")
    return vendor

@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(vendor_id: int, vendor_update: VendorUpdate, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")

    update_data = vendor_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vendor, key, value)

    db.commit()
    db.refresh(vendor)
    return vendor

@router.get("", response_model=list[VendorResponse])
def list_vendors(
    skip: int = 0,
    limit: int = 10,
    latitude: float = None,
    longitude: float = None,
    radius_km: float = 10,
    db: Session = Depends(get_db)
):
    query = db.query(Vendor).offset(skip).limit(limit)

    if latitude and longitude:
        from sqlalchemy import and_
        min_lat = latitude - (radius_km / 111)
        max_lat = latitude + (radius_km / 111)
        min_lon = longitude - (radius_km / (111 * __import__('math').cos(__import__('math').radians(latitude))))
        max_lon = longitude + (radius_km / (111 * __import__('math').cos(__import__('math').radians(latitude))))

        query = query.filter(and_(
            Vendor.latitude >= min_lat,
            Vendor.latitude <= max_lat,
            Vendor.longitude >= min_lon,
            Vendor.longitude <= max_lon
        ))

    return query.all()
