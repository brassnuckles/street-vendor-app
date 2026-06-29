from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Vendor
from app.schemas import VendorRegister, VendorLogin, VendorUpdate, VendorResponse
from app.utils import hash_password, verify_password, create_access_token
from app.routers.auth import get_current_vendor
from app.locations import get_vendors_nearby, get_bounding_box

router = APIRouter()

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

    access_token = create_access_token({"sub": str(db_vendor.id), "type": "vendor"})
    return {
        "id": db_vendor.id,
        "email": db_vendor.email,
        "business_name": db_vendor.business_name,
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")
    return vendor

@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(
    vendor_id: int,
    vendor_update: VendorUpdate,
    current_vendor: Vendor = Depends(get_current_vendor),
    db: Session = Depends(get_db)
):
    if current_vendor.id != vendor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot update other vendors")

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
    if latitude and longitude:
        bbox = get_bounding_box(latitude, longitude, radius_km)
        nearby = get_vendors_nearby(latitude, longitude, radius_km, db)
        vendors = [v['vendor'] for v in nearby[skip:skip + limit]]
        return vendors
    else:
        return db.query(Vendor).offset(skip).limit(limit).all()
