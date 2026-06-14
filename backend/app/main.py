"""
TeleVault FastAPI Application Entry Point
"""
import os, sys
if sys.platform == "win32":
    try:
        os.add_dll_directory(r"C:\Users\rdwn4\.gemini\antigravity-ide\scratch\python_portable\tools")
    except Exception: pass

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.config import settings
from app.db.models import Base
from app.core.database import engine
from app.api.v1 import auth, files, system, websockets


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────
    logger.info("TeleVault starting up…")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ready")
    yield
    # ── Shutdown ──────────────────────────────────────────────────
    logger.info("TeleVault shutting down…")
    engine.dispose()


app = FastAPI(
    title="TeleVault API",
    description="Self-hosted encrypted private cloud storage via Telegram backend",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────
app.include_router(auth.router,       prefix="/api/v1/auth",    tags=["auth"])
app.include_router(files.router,      prefix="/api/v1/files",   tags=["files"])
app.include_router(system.router,     prefix="/api/v1/system",  tags=["system"])
app.include_router(websockets.router, prefix="/ws",             tags=["ws"])


@app.get("/health/live", tags=["health"])
async def liveness():
    return {"status": "alive"}


@app.get("/health/ready", tags=["health"])
async def readiness():
    from app.core.telegram_client import check_telegram_connection

    tg = await check_telegram_connection()
    return {
        "status": "ready",
        "version": "1.0.0",
        "db": "connected",
        "telegram": tg,
        "vault_unlocked": True,
    }
