"""
TeleVault Chunking Engine
Splits files into fixed-size chunks for upload.
"""
import os
import math
import asyncio
import aiofiles
from typing import AsyncIterator, List
from loguru import logger

from app.config import settings
from app.core.crypto import encrypt_chunk


CHUNK_SIZE = settings.DEFAULT_CHUNK_SIZE  # 1.5 MB


def calculate_total_chunks(file_size: int) -> int:
    """Calculate total number of chunks for a given file size."""
    if file_size == 0:
        return 0
    return math.ceil(file_size / CHUNK_SIZE)


async def iter_file_chunks(file_path: str) -> AsyncIterator[tuple[int, bytes, bool]]:
    """
    Async generator that yields (chunk_index, raw_bytes, is_last_chunk).
    Each chunk is exactly CHUNK_SIZE bytes except possibly the last.
    """
    file_size = os.path.getsize(file_path)
    total = calculate_total_chunks(file_size)
    index = 0

    async with aiofiles.open(file_path, 'rb') as f:
        while True:
            data = await f.read(CHUNK_SIZE)
            if not data:
                break
            is_last = (index == total - 1)
            yield index, data, is_last
            index += 1


async def chunk_and_encrypt_file(
    file_path: str,
    aes_key: bytes,
    hmac_key: bytes,
) -> AsyncIterator[tuple[int, bytes, bool]]:
    """
    Async generator that yields (chunk_index, encrypted_blob, is_last).
    Encrypts each chunk with AES-256-CBC + HMAC-SHA256.
    """
    async for chunk_index, raw_data, is_last in iter_file_chunks(file_path):
        # Run CPU-bound encryption in thread pool
        loop = asyncio.get_event_loop()
        encrypted = await loop.run_in_executor(
            None, encrypt_chunk, raw_data, aes_key, hmac_key, is_last
        )
        logger.debug(f"Chunk {chunk_index}: {len(raw_data)}B → {len(encrypted)}B encrypted")
        yield chunk_index, encrypted, is_last


async def write_chunk_to_temp(chunk_index: int, data: bytes, temp_dir: str) -> str:
    """Write an encrypted chunk to a temp file and return its path."""
    os.makedirs(temp_dir, exist_ok=True)
    path = os.path.join(temp_dir, f"chunk_{chunk_index:06d}.bin")
    async with aiofiles.open(path, 'wb') as f:
        await f.write(data)
    return path
