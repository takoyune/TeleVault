"""
TeleVault Configuration — pydantic-settings
All secrets loaded from environment variables / .env file
"""
import os
import sys
import tempfile
from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List

_PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _default_temp_dir() -> str:
    return os.path.join(tempfile.gettempdir(), "televault")


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────────────
    APP_NAME: str = "TeleVault"
    DEBUG: bool = False
    # ── App Security ──────────────────────────────────────────────
    SECRET_KEY: str = "supersecret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_SECONDS: int = 3600  # 1 hour session
    MASTER_PASSWORD: str = "password123"  # Default password

    # ── Database ──────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./televault_dev.db"
    POSTGRES_PASSWORD: str = ""  # used by docker-compose only

    # ── Redis ─────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: str = ""  # used by docker-compose only

    # ── Telegram ──────────────────────────────────────────────────
    TELEGRAM_API_ID: int = 0
    TELEGRAM_API_HASH: str = ""
    TELEGRAM_SESSION_STRING: str = ""
    TELEGRAM_CHANNEL_ID: int = 0

    # ── Chunking ──────────────────────────────────────────────────
    DEFAULT_CHUNK_SIZE: int = 1_572_864          # 1.5 MB
    MAX_CHUNK_SIZE_MTPROTO: int = 4_194_304      # 4 MB
    MAX_PARALLEL_CHUNK_UPLOADS: int = 3

    # ── Crypto ───────────────────────────────────────────────────
    AES_KEY_SIZE: int = 32           # 256-bit
    HMAC_KEY_SIZE: int = 32          # 256-bit
    IV_SIZE: int = 16                # 128-bit
    HMAC_TAG_SIZE: int = 32          # SHA-256 output
    ARGON2_TIME_COST: int = 2
    ARGON2_MEMORY_COST: int = 65_536  # 64 MB
    ARGON2_PARALLELISM: int = 2
    ARGON2_HASH_LENGTH: int = 32

    # ── Temp storage ─────────────────────────────────────────────
    TEMP_DIR: str = _default_temp_dir()

    @field_validator("TEMP_DIR", mode="after")
    @classmethod
    def normalize_temp_dir(cls, value: str) -> str:
        if sys.platform == "win32" and value.replace("\\", "/").startswith("/tmp"):
            return _default_temp_dir()
        return value

    # ── CORS ─────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = str(_PROJECT_ROOT / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
