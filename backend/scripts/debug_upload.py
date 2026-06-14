"""Debug upload pipeline."""
import asyncio
import os
import traceback
import uuid

from app.config import settings
from app.core.chunking import chunk_and_encrypt_file
from app.core.crypto import encrypt_file_keys, generate_file_keys
from app.core.telegram_client import upload_chunk
from app.core.vault_session import store_kek


async def main():
    os.makedirs(settings.TEMP_DIR, exist_ok=True)
    path = os.path.join(settings.TEMP_DIR, f"debug_{uuid.uuid4().hex}.txt")
    with open(path, "wb") as f:
        f.write(b"debug upload test\n")

    kek = store_kek("debug-token", "televault-test")
    aes_key, hmac_key = generate_file_keys()
    encrypt_file_keys(aes_key, hmac_key, kek)

    try:
        async for idx, encrypted, _ in chunk_and_encrypt_file(path, aes_key, hmac_key):
            print(f"chunk {idx} size {len(encrypted)}")
            msg_id = await upload_chunk(encrypted, filename=f"debug_{idx}.bin")
            print(f"telegram msg_id={msg_id}")
    except Exception:
        traceback.print_exc()
        return 1
    finally:
        if os.path.exists(path):
            try:
                os.remove(path)
                print("temp removed")
            except OSError as e:
                print(f"remove failed: {e}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
