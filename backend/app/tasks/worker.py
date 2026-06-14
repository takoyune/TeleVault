"""ARQ background worker settings."""
import os, sys
if sys.platform == "win32":
    try:
        os.add_dll_directory(r"C:\Users\rdwn4\.gemini\antigravity-ide\scratch\python_portable\tools")
    except Exception: pass
from arq import cron
from app.config import settings


async def upload_file_task(ctx, file_id: str, temp_path: str, tags: list, description: str):
    """Background task: chunk → encrypt → upload to Telegram."""
    # TODO: implement full pipeline using chunking.py + telegram.py
    pass


async def cleanup_orphaned_chunks(ctx):
    """Daily task: find and delete orphaned chunks on Telegram."""
    pass


async def startup(ctx):
    pass


async def shutdown(ctx):
    pass


from arq.connections import RedisSettings

class WorkerSettings:
    functions = [upload_file_task, cleanup_orphaned_chunks]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    on_startup = startup
    on_shutdown = shutdown
    cron_jobs = [
        cron(cleanup_orphaned_chunks, hour=3, minute=0),  # 3 AM daily
    ]
