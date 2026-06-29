from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Customer
from app.schemas import CustomerRegister, CustomerLogin, CustomerUpdate, CustomerResponse
from app.utils import hash_password, verify_password, create_access_token
from app.routers.auth import get_current_customer

router = APIRouter()

@router.post("/register", response_model=CustomerResponse)
def register_customer(customer: CustomerRegister, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.email == customer.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    db_customer = Customer(
        email=customer.email,
        password_hash=hash_password(customer.password),
        full_name=customer.full_name,
        phone=customer.phone
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.post("/login")
def login_customer(customer: CustomerLogin, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.email == customer.email).first()
    if not db_customer or not verify_password(customer.password, db_customer.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(db_customer.id), "type": "customer"})
    return {
        "id": db_customer.id,
        "email": db_customer.email,
        "full_name": db_customer.full_name,
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    if current_customer.id != customer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot update other customers")

    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    update_data = customer_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)

    db.commit()
    db.refresh(customer)
    return customer
