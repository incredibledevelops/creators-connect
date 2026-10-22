from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.database import close_mongo_connection, connect_to_mongo
from app.routers import (
    accounts, activity, admin, auth, chat, dashboard, drive, payments, projects, schedule, users, workspaces,
)
from app.services.scheduler import start_scheduler, stop_scheduler
from app.services.storage import STORAGE_ROOT

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    
    # Seed Admin User
    from app.database import get_db
    from app.core.security import hash_password
    db = get_db()
    admin_exists = await db.users.find_one({"email": settings.ADMIN_EMAIL.lower()})
    
    if not admin_exists:
        now = datetime.now(timezone.utc)
        await db.users.insert_one({
            "email": settings.ADMIN_EMAIL.lower(),
            "password_hash": hash_password(settings.ADMIN_PASSWORD),
            "full_name": "Super Admin",
            "role": "admin",
            "subscription": {
                "status": "active", 
                "plan": "studio",
                "current_period_start": now,
                "current_period_end": now + timedelta(days=3650) # 10 years
            },
            "created_at": now
        })
        print(f"👑 Admin user seeded: {settings.ADMIN_EMAIL}")
    else:
        # If admin already exists (like yours), update their subscription so they aren't blocked
        await db.users.update_one(
            {"email": settings.ADMIN_EMAIL.lower()},
            {"$set": {
                "subscription.status": "active",
                "subscription.plan": "studio",
                "subscription.current_period_end": datetime.now(timezone.utc) + timedelta(days=3650)
            }}
        )

    start_scheduler()
    yield
    stop_scheduler()
    await close_mongo_connection()

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DEFAULT])
app = FastAPI(title=settings.APP_NAME, version="3.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(STORAGE_ROOT)), name="static")

api = settings.API_V1_PREFIX
app.include_router(auth.router,      prefix=f"{api}/auth",      tags=["Auth"])
app.include_router(users.router,     prefix=f"{api}/users",     tags=["Users"])
app.include_router(workspaces.router,prefix=f"{api}/workspace", tags=["Workspace"])
app.include_router(projects.router,  prefix=f"{api}/projects",  tags=["Projects"])
app.include_router(chat.router,      prefix=f"{api}/chat",      tags=["Chat"])
app.include_router(schedule.router,  prefix=f"{api}/schedule",  tags=["Schedule"])
app.include_router(drive.router,     prefix=f"{api}/drive",     tags=["Google Drive"])
app.include_router(accounts.router,  prefix=f"{api}/accounts",  tags=["Social Accounts"])
app.include_router(payments.router,  prefix=f"{api}/payments",  tags=["Payments"])
app.include_router(activity.router,  prefix=f"{api}/activity",  tags=["Activity"])
app.include_router(dashboard.router, prefix=f"{api}/dashboard", tags=["Dashboard"])
app.include_router(admin.router,     prefix=f"{api}/admin",     tags=["Admin"])

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": f"{settings.APP_NAME} API v3"}