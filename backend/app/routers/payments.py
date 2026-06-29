from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import stripe
from app.database import get_db
from app.models import Payment, Order
from app.schemas import PaymentCreate, PaymentResponse
from app.config import settings

router = APIRouter()
stripe.api_key = settings.stripe_secret_key

@router.post("", response_model=PaymentResponse)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(payment.amount * 100),
            currency=payment.currency.lower(),
            metadata={"order_id": payment.order_id},
            receipt_email=payment.customer_email
        )

        db_payment = Payment(
            order_id=payment.order_id,
            stripe_payment_intent_id=intent.id,
            amount=payment.amount,
            currency=payment.currency,
            customer_email=payment.customer_email,
            status="pending"
        )
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)

        return {**db_payment.__dict__, "client_secret": intent.client_secret}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/webhook")
async def handle_stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_secret_key
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        payment = db.query(Payment).filter(
            Payment.stripe_payment_intent_id == payment_intent["id"]
        ).first()

        if payment:
            payment.status = "completed"
            order = db.query(Order).filter(Order.id == int(payment.order_id)).first()
            if order:
                order.status = "paid"
                order.payment_id = payment.id
            db.commit()

    elif event["type"] == "payment_intent.payment_failed":
        payment_intent = event["data"]["object"]
        payment = db.query(Payment).filter(
            Payment.stripe_payment_intent_id == payment_intent["id"]
        ).first()

        if payment:
            payment.status = "failed"
            payment.error_message = payment_intent.get("last_payment_error", {}).get("message")
            db.commit()

    return {"status": "received"}

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return payment

@router.get("/order/{order_id}", response_model=PaymentResponse)
def get_payment_by_order(order_id: str, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return payment
