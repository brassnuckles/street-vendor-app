import os
from pathlib import Path
from typing import Optional
import uuid
from app.config import settings

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

class StorageService:
    @staticmethod
    def save_file(file_content: bytes, filename: str, folder: str = "products") -> str:
        """
        Save a file locally or to S3 depending on configuration
        Returns the file URL/path
        """
        file_extension = Path(filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        folder_path = UPLOAD_DIR / folder
        folder_path.mkdir(parents=True, exist_ok=True)

        file_path = folder_path / unique_filename

        with open(file_path, "wb") as f:
            f.write(file_content)

        return f"/uploads/{folder}/{unique_filename}"

    @staticmethod
    def delete_file(file_path: str) -> bool:
        """
        Delete a file from storage
        """
        try:
            full_path = Path(file_path.lstrip("/"))
            if full_path.exists():
                full_path.unlink()
            return True
        except Exception:
            return False

    @staticmethod
    def get_file_url(file_path: str) -> str:
        """
        Get the public URL for a file
        """
        if file_path.startswith("http"):
            return file_path
        return f"http://localhost:8000{file_path}"

storage_service = StorageService()
