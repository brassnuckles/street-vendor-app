from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.storage import storage_service
from app.routers.auth import get_current_vendor, get_current_user
from pydantic import BaseModel

router = APIRouter()

class FileUploadResponse(BaseModel):
    url: str
    filename: str

@router.post("/products", response_model=FileUploadResponse)
async def upload_product_image(
    file: UploadFile = File(...),
    current_vendor = Depends(get_current_vendor)
):
    """Upload an image for a product"""
    allowed_extensions = {"jpg", "jpeg", "png", "gif", "webp"}
    file_extension = file.filename.split(".")[-1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: jpg, jpeg, png, gif, webp"
        )

    try:
        content = await file.read()

        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size too large. Maximum 10MB"
            )

        file_path = storage_service.save_file(content, file.filename, "products")
        file_url = storage_service.get_file_url(file_path)

        return FileUploadResponse(
            url=file_url,
            filename=file.filename
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file"
        )

@router.post("/profiles", response_model=FileUploadResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Upload a profile image for vendor or customer"""
    allowed_extensions = {"jpg", "jpeg", "png", "gif", "webp"}
    file_extension = file.filename.split(".")[-1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: jpg, jpeg, png, gif, webp"
        )

    try:
        content = await file.read()

        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size too large. Maximum 5MB"
            )

        folder = "vendor_profiles" if hasattr(current_user, "business_name") else "customer_profiles"
        file_path = storage_service.save_file(content, file.filename, folder)
        file_url = storage_service.get_file_url(file_path)

        return FileUploadResponse(
            url=file_url,
            filename=file.filename
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file"
        )
