"""FastAPI dependencies."""
from fastapi import Depends, Header, HTTPException, status

from app.core.vault_session import get_kek


def get_bearer_token(authorization: str | None = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return authorization[7:]


def require_kek(token: str = Depends(get_bearer_token)) -> bytes:
    kek = get_kek(token)
    if not kek:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vault locked — unlock again with your master password",
        )
    return kek
