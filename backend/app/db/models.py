"""
TeleVault SQLAlchemy ORM Models
"""
import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    String, BigInteger, Integer, Boolean, Text,
    DateTime, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ARRAY

from app.core.database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


class File(Base):
    __tablename__ = "files"

    file_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    original_name: Mapped[str] = mapped_column(String(512), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(128), default="application/octet-stream")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Encryption
    encrypted_aes_key: Mapped[bytes] = mapped_column(nullable=False)   # AES key encrypted with KEK
    encrypted_hmac_key: Mapped[bytes] = mapped_column(nullable=False)  # HMAC key encrypted with KEK
    kek_salt: Mapped[bytes] = mapped_column(nullable=False)            # Argon2id salt

    # Chunking
    total_chunks: Mapped[int] = mapped_column(Integer, nullable=False)
    upload_status: Mapped[str] = mapped_column(
        String(20), default="pending",
        # Values: pending | uploading | complete | failed
    )
    upload_started: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    upload_finished: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Soft delete
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    chunks: Mapped[List["Chunk"]] = relationship("Chunk", back_populates="file", cascade="all, delete-orphan")
    tags: Mapped[List["FileTag"]] = relationship("FileTag", back_populates="file", cascade="all, delete-orphan")


class Chunk(Base):
    __tablename__ = "chunks"

    chunk_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    file_id: Mapped[str] = mapped_column(String(36), ForeignKey("files.file_id"), nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    telegram_message_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    upload_status: Mapped[str] = mapped_column(String(20), default="pending")
    # Values: pending | uploaded | failed

    # Relationships
    file: Mapped["File"] = relationship("File", back_populates="chunks")


class FileTag(Base):
    __tablename__ = "file_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    file_id: Mapped[str] = mapped_column(String(36), ForeignKey("files.file_id"), nullable=False)
    tag: Mapped[str] = mapped_column(String(64), nullable=False)

    file: Mapped["File"] = relationship("File", back_populates="tags")


class UploadSession(Base):
    """Tracks resumable upload state."""
    __tablename__ = "upload_sessions"

    session_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    file_id: Mapped[str] = mapped_column(String(36), ForeignKey("files.file_id"), nullable=False)
    last_chunk_index: Mapped[int] = mapped_column(Integer, default=-1)
    temp_file_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
