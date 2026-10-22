from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.dependencies import get_current_admin
from app.utils.serializers import doc_to_dict, serialize_user

router = APIRouter()

@router.get("/stats")
async def get_admin_stats(admin: dict = Depends(get_current_admin)):
    db = get_db()
    
    total_users = await db.users.count_documents({})
    active_subs = await db.users.count_documents({"subscription.status": "active"})
    trialing = await db.users.count_documents({"subscription.status": "trialing"})
    
    # Calculate MRR (Monthly Recurring Revenue)
    pipeline = [
        {"$match": {"status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_ghs"}}}
    ]
    revenue_result = await db.payments.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0.0

    return {
        "users": {"total": total_users, "active": active_subs, "trialing": trialing},
        "revenue": {"total_ghs": total_revenue}
    }

@router.get("/users")
async def list_users(admin: dict = Depends(get_current_admin)):
    db = get_db()
    cursor = db.users.find({}).sort("created_at", -1).limit(100)
    users = await cursor.to_list(100)
    return {"users": [serialize_user(u) for u in users]}

@router.patch("/users/{user_id}/suspend")
async def suspend_user(user_id: str, admin: dict = Depends(get_current_admin)):
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    await db.users.update_one(
        {"_id": oid}, 
        {"$set": {"status": "suspended", "subscription.status": "expired"}}
    )
    return {"message": "User suspended."}

@router.get("/payments")
async def list_all_payments(admin: dict = Depends(get_current_admin)):
    db = get_db()
    cursor = db.payments.find({}).sort("created_at", -1).limit(100)
    payments = await cursor.to_list(100)
    return {"payments": [doc_to_dict(p) for p in payments]}