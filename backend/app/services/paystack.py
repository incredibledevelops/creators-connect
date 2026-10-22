import hashlib
import hmac
import secrets

import httpx
from fastapi import HTTPException

from app.config import settings


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


def generate_reference(prefix: str = "CC") -> str:
    return f"{prefix}-{secrets.token_hex(8).upper()}"


async def initialize_transaction(
    *,
    email: str,
    amount_pesewas: int,
    reference: str,
    callback_url: str,
    metadata: dict,
) -> dict:
    payload = {
        "email": email,
        "amount": amount_pesewas,
        "currency": settings.PAYSTACK_CURRENCY,
        "reference": reference,
        "callback_url": callback_url,
        "metadata": metadata,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{settings.PAYSTACK_BASE_URL}/transaction/initialize",
            headers=_headers(),
            json=payload,
        )
    data = resp.json()
    if not data.get("status"):
        raise HTTPException(
            status_code=502,
            detail=data.get("message", "Paystack could not initialize the transaction."),
        )
    return data["data"]


async def verify_transaction(reference: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{settings.PAYSTACK_BASE_URL}/transaction/verify/{reference}",
            headers=_headers(),
        )
    data = resp.json()
    if not data.get("status"):
        raise HTTPException(
            status_code=502,
            detail=data.get("message", "Could not verify transaction."),
        )
    return data["data"]


def verify_webhook_signature(raw_body: bytes, signature: str | None) -> bool:
    if not signature:
        return False
    computed = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode("utf-8"),
        raw_body,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(computed, signature)