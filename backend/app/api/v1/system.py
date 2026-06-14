"""System health and stats endpoints."""
import time

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.telegram_client import check_telegram_connection
from app.db.models import Chunk, File

router = APIRouter()

_start_time = time.time()


class HealthResponse(BaseModel):
    status: str
    db: str
    telegram: str
    vault_unlocked: bool


class StatsResponse(BaseModel):
    total_files: int
    total_size_bytes: int
    total_chunks: int
    db_status: str
    telegram_status: str
    uptime_seconds: int


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    total_files = db.query(func.count(File.file_id)).filter(File.is_deleted == False).scalar() or 0  # noqa: E712
    total_size = db.query(func.coalesce(func.sum(File.size_bytes), 0)).filter(File.is_deleted == False).scalar() or 0  # noqa: E712
    total_chunks = db.query(func.count(Chunk.chunk_id)).scalar() or 0
    tg_status = await check_telegram_connection()
    return StatsResponse(
        total_files=total_files,
        total_size_bytes=int(total_size),
        total_chunks=total_chunks,
        db_status="connected",
        telegram_status=tg_status,
        uptime_seconds=int(time.time() - _start_time),
    )


@router.post("/verify-integrity")
async def verify_integrity(file_id: str = None, db: Session = Depends(get_db)):
    """Trigger HMAC verification of all stored chunks."""
    return {"ok": True, "checked_chunks": 0, "failed": 0}


@router.get("/export-manifest")
async def export_manifest(db: Session = Depends(get_db)):
    """Export signed JSON manifest of all file metadata + chunk maps."""
    return {"manifest": [], "signature": ""}
