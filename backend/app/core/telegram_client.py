"""
Telegram client for uploading/downloading encrypted chunk blobs.
"""
import io
from typing import Optional

from loguru import logger
from telethon import TelegramClient
from telethon.sessions import StringSession

from app.config import settings

_client: Optional[TelegramClient] = None


def resolve_channel_id(channel_id: int) -> int:
    """
    Normalize Telegram channel/supergroup IDs.
    Web URLs often show -100XXXXXXXXXX; some setups only store the bare numeric part.
    """
    if channel_id == 0:
        return channel_id
    text = str(channel_id)
    if text.startswith("-100"):
        return channel_id
    if channel_id < 0:
        bare = str(abs(channel_id))
        return int(f"-100{bare}")
    return channel_id


async def get_telegram_client() -> TelegramClient:
    """Return a connected Telethon client (reused across requests)."""
    global _client
    if _client is None or not _client.is_connected():
        if not settings.TELEGRAM_SESSION_STRING:
            raise RuntimeError("TELEGRAM_SESSION_STRING is not configured")
        _client = TelegramClient(
            StringSession(settings.TELEGRAM_SESSION_STRING),
            settings.TELEGRAM_API_ID,
            settings.TELEGRAM_API_HASH,
        )
        await _client.connect()
        if not await _client.is_user_authorized():
            raise RuntimeError("Telegram session is not authorized")
        logger.info("Telegram client connected")
    return _client


async def check_telegram_connection() -> str:
    """Return 'connected' or an error description."""
    try:
        client = await get_telegram_client()
        await client.get_me()
        channel_id = resolve_channel_id(settings.TELEGRAM_CHANNEL_ID)
        entity = await client.get_entity(channel_id)
        if not entity:
            return "error: storage channel not found"
        return "connected"
    except Exception as exc:
        logger.warning(f"Telegram check failed: {exc}")
        return f"error: {exc}"


async def upload_chunk(data: bytes, filename: str = "chunk.bin") -> int:
    """Upload encrypted chunk as a document. Returns Telegram message ID."""
    client = await get_telegram_client()
    channel_id = resolve_channel_id(settings.TELEGRAM_CHANNEL_ID)
    buf = io.BytesIO(data)
    buf.name = filename
    message = await client.send_file(
        channel_id,
        buf,
        force_document=True,
    )
    return message.id


async def download_chunk(message_id: int) -> bytes:
    """Download chunk blob bytes from Telegram by message ID."""
    client = await get_telegram_client()
    channel_id = resolve_channel_id(settings.TELEGRAM_CHANNEL_ID)
    message = await client.get_messages(channel_id, ids=message_id)
    if not message or not message.media:
        raise ValueError(f"Telegram message {message_id} not found or has no media")
    data = await client.download_media(message, bytes)
    if not data:
        raise ValueError(f"Failed to download Telegram message {message_id}")
    return data


async def delete_chunk(message_id: int) -> None:
    """Delete a chunk message from Telegram."""
    client = await get_telegram_client()
    channel_id = resolve_channel_id(settings.TELEGRAM_CHANNEL_ID)
    await client.delete_messages(channel_id, message_id)
