"""
Auth API — vault unlock/lock/status
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from jose import jwt

from app.config import settings
from app.core.deps import get_bearer_token
from app.core.vault_session import clear_kek, has_kek, store_kek

router = APIRouter()


class UnlockRequest(BaseModel):
    master_password: str


class UnlockResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class StatusResponse(BaseModel):
    unlocked: bool
    expires_at: datetime | None = None


@router.post("/unlock", response_model=UnlockResponse)
async def unlock_vault(body: UnlockRequest):
    """
    Unlock the vault with the master password.
    The password is used locally to derive the KEK via Argon2id.
    We issue a JWT for subsequent API calls.
    In production: validate password against stored hash or attempt key derivation test.
    """
    if not body.master_password:
        raise HTTPException(status_code=400, detail="Password required")
        
    if settings.MASTER_PASSWORD and body.master_password != settings.MASTER_PASSWORD:
        raise HTTPException(status_code=401, detail="Incorrect master password")

    # Issue JWT
    expire = datetime.utcnow() + timedelta(seconds=settings.JWT_EXPIRE_SECONDS)
    payload = {
        "sub": "vault",
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    store_kek(token, body.master_password)
    return UnlockResponse(
        access_token=token,
        expires_in=settings.JWT_EXPIRE_SECONDS,
    )


@router.post("/lock")
async def lock_vault(token: str = Depends(get_bearer_token)):
    """Lock the vault (client should discard the JWT)."""
    clear_kek(token)
    return {"ok": True}


@router.get("/status", response_model=StatusResponse)
async def vault_status(token: str = Depends(get_bearer_token)):
    """Check if the vault is accessible and encryption keys are loaded."""
    return StatusResponse(unlocked=has_kek(token))
