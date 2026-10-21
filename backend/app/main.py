from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import close_mongo_connection, connect_to_mongo
from app.routers import auth, chat, drive, payments, projects, schedule, users
from app.services.scheduler import start_scheduler, stop_scheduler
from app.services.storage import STORAGE_ROOT


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    start_scheduler()
    yield
    stop_scheduler()
    await close_mongo_connection()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve local system files (avatars, chat uploads)
app.mount("/static", StaticFiles(directory=str(STORAGE_ROOT)), name="static")

api = settings.API_V1_PREFIX
app.include_router(auth.router,     prefix=f"{api}/auth",     tags=["Auth"])
app.include_router(users.router,    prefix=f"{api}/users",    tags=["Users"])
app.include_router(projects.router, prefix=f"{api}/projects", tags=["Projects"])
app.include_router(chat.router,     prefix=f"{api}/chat",     tags=["Chat"])
app.include_router(schedule.router, prefix=f"{api}/schedule", tags=["Schedule"])
app.include_router(drive.router,    prefix=f"{api}/drive",    tags=["Google Drive"])
app.include_router(payments.router, prefix=f"{api}/payments", tags=["Payments"])


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.ENVIRONMENT}


@app.get("/")
async def root():
    return {"message": f"{settings.APP_NAME} API", "docs": "/docs"}