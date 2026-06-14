"""WebSocket endpoints for real-time upload/download progress."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

router = APIRouter()


@router.websocket("/progress/{file_id}")
async def upload_progress(websocket: WebSocket, file_id: str):
    """
    WebSocket stream for upload progress events.
    Client connects and receives JSON messages:
    {
        "type": "chunk_progress",
        "file_id": "...",
        "chunk_index": 5,
        "total_chunks": 32,
        "progress_pct": 18.75,
        "status": "uploading"
    }
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Echo for now; real implementation polls ARQ job status
            await websocket.send_json({"type": "ack", "data": data})
    except WebSocketDisconnect:
        logger.info(f"WS disconnected for file {file_id}")
