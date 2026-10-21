from datetime import datetime, timedelta, timezone
import json

from fastapi import APIRouter, Depends, HTTPException, Request

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.payment import InitializePaymentIn
from app.services import paystack as paystack_service
from app.utils.plans import PLANS, get_plan
from app.utils.serializers import doc_to_dict, utc

router = APIRouter()


@router.get("/plans")
async def list_plans():
    return {"currency": settings.PAYSTACK_CURRENCY, "plans": list(PLANS.values())}


@router.get("/subscription")
async def my_subscription(user: dict = Depends(get_current_user)):
    sub = user.get("subscription", {})
    return {
        "subscription": {
            "plan": sub.get("plan"),
            "status": sub.get("status"),
            "trial_started_at": sub.get("trial_started_at"),
            "trial_ends_at": sub.get("trial_ends_at"),
            "current_period_start": sub.get("current_period_start"),
            "current_period_end": sub.get("current_period_end"),
            "last_payment_at": sub.get("last_payment_at"),
        }
    }


@router.get("/history")
async def payment_history(user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.payments.find({"user_id": user["_id"]}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    return {"payments": [doc_to_dict(d) for d in docs]}


@router.post("/initialize", status_code=201)
async def initialize_payment(payload: InitializePaymentIn, user: dict = Depends(get_current_user)):
    plan = get_plan(payload.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Unknown plan.")

    db = get_db()
    reference = paystack_service.generate_reference(prefix="CC")
    now = datetime.now(timezone.utc)

    payment_doc = {
        "user_id": user["_id"],
        "reference": reference,
        "plan": plan["id"],
        "amount_pesewas": plan["price_pesewas"],
        "amount_ghs": plan["price_ghs"],
        "currency": settings.PAYSTACK_CURRENCY,
        "status": "pending",
        "period_start": None,
        "period_end": None,
        "created_at": now,
        "verified_at": None,
        "paystack_data": None,
    }
    await db.payments.insert_one(payment_doc)

    callback_url = f"{settings.FRONTEND_URL}/billing/verify?reference={reference}"
    try:
        init = await paystack_service.initialize_transaction(
            email=user["email"],
            amount_pesewas=plan["price_pesewas"],
            reference=reference,
            callback_url=callback_url,
            metadata={
                "user_id": str(user["_id"]),
                "plan": plan["id"],
                "purpose": "creators_connect_subscription",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Paystack error: {e}")

    return {
        "authorization_url": init.get("authorization_url"),
        "access_code": init.get("access_code"),
        "reference": reference,
        "plan": plan,
    }


async def _apply_successful_payment(reference: str) -> dict:
    """Idempotently apply a verified payment to the user's subscription."""
    db = get_db()
    payment = await db.payments.find_one({"reference": reference})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found.")

    if payment["status"] == "success":
        return {"message": "Already applied.", "payment": doc_to_dict(payment)}

    plan = get_plan(payment["plan"])
    if not plan:
        raise HTTPException(status_code=400, detail="Unknown plan on payment.")

    user = await db.users.find_one({"_id": payment["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    now = datetime.now(timezone.utc)
    sub = user.get("subscription", {})

    current_end = utc(sub.get("current_period_end"))
    if sub.get("status") == "active" and current_end and current_end > now:
        start = current_end
    else:
        start = now
    end = start + timedelta(days=plan["period_days"])

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "subscription.plan": plan["id"],
            "subscription.status": "active",
            "subscription.current_period_start": start,
            "subscription.current_period_end": end,
            "subscription.last_payment_at": now,
            "updated_at": now,
        }},
    )

    await db.payments.update_one(
        {"_id": payment["_id"]},
        {"$set": {
            "status": "success",
            "period_start": start,
            "period_end": end,
            "verified_at": now,
        }},
    )
    return {"message": "Subscription activated.", "period_end": end.isoformat()}


@router.get("/verify/{reference}")
async def verify_payment(reference: str, user: dict = Depends(get_current_user)):
    db = get_db()
    payment = await db.payments.find_one({"reference": reference, "user_id": user["_id"]})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found.")

    if payment["status"] == "success":
        return {"status": "success", "payment": doc_to_dict(payment)}

    result = await paystack_service.verify_transaction(reference)

    # Paystack returns status 'success' on completed payments
    if result.get("status") != "success":
        await db.payments.update_one(
            {"_id": payment["_id"]},
            {"$set": {"status": "failed", "paystack_data": result}},
        )
        return {"status": "failed", "paystack": result}

    # Confirm amount + currency
    if result.get("currency") != settings.PAYSTACK_CURRENCY:
        raise HTTPException(status_code=400, detail="Currency mismatch.")
    if int(result.get("amount", 0)) < payment["amount_pesewas"]:
        raise HTTPException(status_code=400, detail="Amount mismatch.")

    await db.payments.update_one(
        {"_id": payment["_id"]},
        {"$set": {"paystack_data": result}},
    )
    result_msg = await _apply_successful_payment(reference)
    fresh = await db.payments.find_one({"_id": payment["_id"]})
    return {"status": "success", "payment": doc_to_dict(fresh), "subscription": result_msg}


@router.post("/webhook")
async def paystack_webhook(request: Request):
    raw = await request.body()
    signature = request.headers.get("x-paystack-signature")
    if not paystack_service.verify_webhook_signature(raw, signature):
        raise HTTPException(status_code=401, detail="Invalid signature.")

    try:
        event = json.loads(raw.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON.")

    if event.get("event") == "charge.success":
        data = event.get("data", {})
        reference = data.get("reference")
        if not reference:
            return {"status": "ignored"}

        db = get_db()
        payment = await db.payments.find_one({"reference": reference})
        if not payment or payment["status"] == "success":
            return {"status": "ignored"}

        if data.get("currency") != settings.PAYSTACK_CURRENCY:
            return {"status": "ignored"}
        if int(data.get("amount", 0)) < payment["amount_pesewas"]:
            return {"status": "ignored"}

        await db.payments.update_one(
            {"_id": payment["_id"]},
            {"$set": {"paystack_data": data}},
        )
        await _apply_successful_payment(reference)

    return {"status": "ok"}