"""
In-memory vault session store — maps JWT tokens to derived KEKs.
"""
import hashlib
from typing import Optional

from app.config import settings
from app.core.crypto import derive_kek

# token_hash -> kek bytes
_keks: dict[str, bytes] = {}

VAULT_SALT = hashlib.sha256(settings.SECRET_KEY.encode()).digest()[:32]


def _token_key(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def store_kek(token: str, master_password: str) -> bytes:
    kek = derive_kek(master_password, VAULT_SALT)
    _keks[_token_key(token)] = kek
    return kek


def get_kek(token: str) -> Optional[bytes]:
    return _keks.get(_token_key(token))


def clear_kek(token: str) -> None:
    _keks.pop(_token_key(token), None)


def has_kek(token: str) -> bool:
    return _token_key(token) in _keks
