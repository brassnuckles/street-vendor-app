from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pathlib import Path
from app.database import engine, Base, get_db
from app.models import Vendor, Product, Customer, Order, Payment
from app.routers import vendors, products, customers, orders, payments, auth, uploads, notifications, reviews, favorites
from app.config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Street Vendor API",
    description="API for street vendor marketplace",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "street-vendor-api"}

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["vendors"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(favorites.router, prefix="/api/favorites", tags=["favorites"])

upload_dir = Path("uploads")
upload_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.server_host,
        port=settings.server_port,
        reload=True
    )
