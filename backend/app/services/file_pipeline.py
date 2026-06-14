"""
File upload/download pipeline.
"""
import asyncio
import os
import uuid
from datetime import datetime

from loguru import logger
from sqlalchemy.orm import Session

from app.config import settings
from app.core.chunking import calculate_total_chunks, chunk_and_encrypt_file
from app.core.crypto import (
    decrypt_chunk,
    decrypt_file_keys,
    encrypt_file_keys,
    generate_file_keys,
)
from app.core.telegram_client import download_chunk, upload_chunk
from app.db.models import Chunk, File, FileTag


async def process_upload(
    db: Session,
    file_record: File,
    temp_path: str,
    kek: bytes,
    tag_list: list[str],
) -> File:
    """Chunk, encrypt, upload to Telegram, and mark file complete."""
    aes_key, hmac_key = generate_file_keys()
    enc_keys = encrypt_file_keys(aes_key, hmac_key, kek)

    file_record.encrypted_aes_key = enc_keys
    file_record.encrypted_hmac_key = b""
    file_record.total_chunks = calculate_total_chunks(file_record.size_bytes)
    file_record.upload_status = "uploading"
    file_record.upload_started = datetime.utcnow()
    db.add(file_record)

    for tag in tag_list:
        db.add(FileTag(file_id=file_record.file_id, tag=tag))

    db.commit()
    db.refresh(file_record)

    try:
        async for chunk_index, encrypted, _is_last in chunk_and_encrypt_file(
            temp_path, aes_key, hmac_key
        ):
            msg_id = await upload_chunk(
                encrypted,
                filename=f"{file_record.file_id}_{chunk_index:06d}.bin",
            )
            db.add(
                Chunk(
                    file_id=file_record.file_id,
                    chunk_index=chunk_index,
                    size_bytes=len(encrypted),
                    telegram_message_id=msg_id,
                    upload_status="uploaded",
                )
            )
            db.commit()
            logger.info(f"Uploaded chunk {chunk_index + 1}/{file_record.total_chunks} for {file_record.file_id}")

        file_record.upload_status = "complete"
        file_record.upload_finished = datetime.utcnow()
        db.commit()
        db.refresh(file_record)
        return file_record
    except Exception:
        file_record.upload_status = "failed"
        db.commit()
        raise
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


async def reassemble_file(file_record: File, kek: bytes, db: Session) -> bytes:
    """Download all chunks from Telegram, decrypt, and return full file bytes."""
    aes_key, hmac_key = decrypt_file_keys(file_record.encrypted_aes_key, kek)
    chunks = (
        db.query(Chunk)
        .filter(Chunk.file_id == file_record.file_id)
        .order_by(Chunk.chunk_index)
        .all()
    )
    if not chunks:
        raise ValueError("No chunks found for this file")

    parts: list[bytes] = []
    loop = asyncio.get_event_loop()
    for i, chunk in enumerate(chunks):
        if not chunk.telegram_message_id:
            raise ValueError(f"Chunk {chunk.chunk_index} was never uploaded")
        blob = await download_chunk(chunk.telegram_message_id)
        is_last = i == len(chunks) - 1
        plaintext = await loop.run_in_executor(
            None, decrypt_chunk, blob, aes_key, hmac_key, is_last
        )
        parts.append(plaintext)

    return b"".join(parts)


def save_upload_to_temp(upload_filename: str, content: bytes) -> str:
    os.makedirs(settings.TEMP_DIR, exist_ok=True)
    safe_name = os.path.basename(upload_filename) or "upload.bin"
    tmp_path = os.path.join(settings.TEMP_DIR, f"upload_{uuid.uuid4().hex}_{safe_name}")
    with open(tmp_path, "wb") as f:
        f.write(content)
    return tmp_path
