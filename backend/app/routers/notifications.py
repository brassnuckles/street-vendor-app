from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.notifications import NotificationService
from app.routers.auth import get_current_user
from app.models.notification import Notification

router = APIRouter()

class RegisterTokenRequest(BaseModel):
    token: str

class NotificationResponse(BaseModel):
    id: int
    title: str
    body: str
    read: bool
    created_at: str

    class Config:
        from_attributes = True

@router.post("/register-token")
def register_push_token(
    request: RegisterTokenRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register or update push notification token"""
    user_type = "vendor" if hasattr(current_user, "business_name") else "customer"

    success = NotificationService.register_push_token(
        user_id=current_user.id,
        user_type=user_type,
        token=request.token,
        db=db
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register token"
        )

    return {"message": "Token registered successfully"}

@router.get("", response_model=list[NotificationResponse])
def get_notifications(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's notifications"""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

    return notifications

@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    notification.read = True
    db.commit()

    return {"message": "Notification marked as read"}

@router.put("/mark-all-read")
def mark_all_read(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({"read": True})

    db.commit()
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()

    return {"message": "Notification deleted"}
