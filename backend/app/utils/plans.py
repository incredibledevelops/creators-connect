"""Subscription plans in Ghana Cedis (GHS), billed manually every 30 days."""

PLANS: dict[str, dict] = {
    "starter": {
        "id": "starter",
        "name": "Starter",
        "price_ghs": 99.00,
        "price_pesewas": 9900,
        "period_days": 30,
        "seats": 1,
        "description": "For solo creators getting organised.",
        "features": [
            "1 creator seat",
            "3 active projects",
            "30 scheduled posts / 30 days",
            "Google Drive connection",
        ],
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "price_ghs": 249.00,
        "price_pesewas": 24900,
        "period_days": 30,
        "seats": 5,
        "description": "For small teams shipping weekly.",
        "features": [
            "5 creator seats",
            "Unlimited projects & chat rooms",
            "300 scheduled posts / 30 days",
            "Client review links",
            "Performance insights",
        ],
    },
    "studio": {
        "id": "studio",
        "name": "Studio",
        "price_ghs": 499.00,
        "price_pesewas": 49900,
        "period_days": 30,
        "seats": 20,
        "description": "For agencies managing many creators.",
        "features": [
            "20 creator seats",
            "Unlimited scheduling",
            "Custom roles & approvals",
            "Priority support",
        ],
    },
}


def get_plan(plan_id: str) -> dict | None:
    return PLANS.get(plan_id)


def get_seat_limit(plan_id: str) -> int:
    plan = PLANS.get(plan_id)
    return plan["seats"] if plan else 1