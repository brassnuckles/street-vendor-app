import requests
import json
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.notification import PushToken, Notification

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

class NotificationService:
    @staticmethod
    def send_push_notification(
        user_id: int,
        user_type: str,
        title: str,
        body: str,
        data: Optional[dict] = None,
        db: Optional[Session] = None
    ) -> bool:
        """Send push notification to a user via Expo"""
        if not db:
            return False

        tokens = db.query(PushToken).filter(
            PushToken.user_id == user_id,
            PushToken.user_type == user_type,
            PushToken.is_active == True
        ).all()

        if not tokens:
            return False

        for token_obj in tokens:
            try:
                message = {
                    "to": token_obj.token,
                    "sound": "default",
                    "title": title,
                    "body": body,
                    "data": data or {},
                }

                response = requests.post(EXPO_PUSH_URL, json=message)

                if response.status_code == 200:
                    notification = Notification(
                        user_id=user_id,
                        user_type=user_type,
                        title=title,
                        body=body,
                        data=json.dumps(data) if data else None,
                        sent=True
                    )
                    db.add(notification)
                    db.commit()
            except Exception as e:
                print(f"Failed to send push notification: {e}")
                continue

        return True

    @staticmethod
    def register_push_token(
        user_id: int,
        user_type: str,
        token: str,
        db: Session
    ) -> bool:
        """Register or update a push token"""
        try:
            existing = db.query(PushToken).filter(PushToken.token == token).first()
            if existing:
                existing.user_id = user_id
                existing.user_type = user_type
                existing.is_active = True
            else:
                push_token = PushToken(
                    user_id=user_id,
                    user_type=user_type,
                    token=token
                )
                db.add(push_token)

            db.commit()
            return True
        except Exception as e:
            print(f"Failed to register push token: {e}")
            return False

    @staticmethod
    def order_created_notification(order_id: int, vendor_id: int, db: Session):
        """Send notification when a new order is created"""
        NotificationService.send_push_notification(
            user_id=vendor_id,
            user_type="vendor",
            title="New Order",
            body=f"You have a new order #{order_id}",
            data={"order_id": str(order_id), "type": "order_created"},
            db=db
        )

    @staticmethod
    def order_paid_notification(order_id: int, customer_id: int, db: Session):
        """Send notification when order is paid"""
        NotificationService.send_push_notification(
            user_id=customer_id,
            user_type="customer",
            title="Payment Received",
            body=f"Payment confirmed for order #{order_id}",
            data={"order_id": str(order_id), "type": "order_paid"},
            db=db
        )

    @staticmethod
    def order_status_update_notification(
        order_id: int,
        customer_id: int,
        status: str,
        db: Session
    ):
        """Send notification when order status changes"""
        status_messages = {
            "processing": "Your order is being prepared",
            "completed": "Your order is ready for pickup",
            "cancelled": "Your order has been cancelled"
        }

        message = status_messages.get(status, f"Your order status changed to {status}")

        NotificationService.send_push_notification(
            user_id=customer_id,
            user_type="customer",
            title="Order Update",
            body=message,
            data={"order_id": str(order_id), "status": status},
            db=db
        )
