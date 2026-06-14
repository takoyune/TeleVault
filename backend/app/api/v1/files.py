"""
Files API — CRUD, search, upload, download
"""
import mimetypes
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import require_kek
from app.config import settings
from app.db.models import Chunk, File as FileModel, FileTag
from app.services.file_pipeline import process_upload, reassemble_file, save_upload_to_temp

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────

class ChunkSchema(BaseModel):
    chunk_id: str
    chunk_index: int
    upload_status: str
    telegram_message_id: Optional[int] = None
    size_bytes: int

    class Config:
        from_attributes = True


class FileSchema(BaseModel):
    file_id: str
    original_name: str
    size_bytes: int
    mime_type: str
    description: Optional[str] = None
    upload_status: str
    upload_started: Optional[datetime] = None
    upload_finished: Optional[datetime] = None
    total_chunks: int
    tags: List[str] = []

    class Config:
        from_attributes = True


class FileDetailSchema(FileSchema):
    chunks: List[ChunkSchema] = []


class FileListResponse(BaseModel):
    items: List[FileSchema]
    total: int
    page: int
    limit: int


class UpdateFileRequest(BaseModel):
    description: Optional[str] = None
    tags: Optional[List[str]] = None


def _file_to_schema(f: FileModel) -> FileSchema:
    return FileSchema(
        file_id=f.file_id,
        original_name=f.original_name,
        size_bytes=f.size_bytes,
        mime_type=f.mime_type,
        description=f.description,
        upload_status=f.upload_status,
        upload_started=f.upload_started,
        upload_finished=f.upload_finished,
        total_chunks=f.total_chunks,
        tags=[t.tag for t in f.tags],
    )


def _get_file_or_404(db: Session, file_id: str) -> FileModel:
    f = (
        db.query(FileModel)
        .options(joinedload(FileModel.tags), joinedload(FileModel.chunks))
        .filter(FileModel.file_id == file_id, FileModel.is_deleted == False)  # noqa: E712
        .first()
    )
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    return f


# ── Endpoints ─────────────────────────────────────────────────────

@router.get("", response_model=FileListResponse)
async def list_files(
    page: int = 1,
    limit: int = 50,
    sort: str = "upload_started:desc",
    status: str = "complete",
    db: Session = Depends(get_db),
    _kek: bytes = Depends(require_kek),
):
    query = db.query(FileModel).options(joinedload(FileModel.tags)).filter(FileModel.is_deleted == False)  # noqa: E712
    if status != "all":
        query = query.filter(FileModel.upload_status == status)

    sort_field, _, sort_dir = sort.partition(":")
    order_col = getattr(FileModel, sort_field, FileModel.upload_started)
    if sort_dir == "asc":
        query = query.order_by(order_col.asc())
    else:
        query = query.order_by(order_col.desc())

    total = query.count()
    offset = max(0, (page - 1) * limit)
    files = query.offset(offset).limit(limit).all()
    return FileListResponse(
        items=[_file_to_schema(f) for f in files],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/search", response_model=FileListResponse)
async def search_files(
    q: Optional[str] = None,
    tags: Optional[str] = None,
    mime: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    _kek: bytes = Depends(require_kek),
):
    query = db.query(FileModel).options(joinedload(FileModel.tags)).filter(FileModel.is_deleted == False)  # noqa: E712
    if q:
        like = f"%{q}%"
        query = query.filter(
            (FileModel.original_name.ilike(like)) | (FileModel.description.ilike(like))
        )
    if mime:
        query = query.filter(FileModel.mime_type == mime)
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        for tag in tag_list:
            query = query.filter(FileModel.tags.any(FileTag.tag == tag))

    total = query.count()
    offset = max(0, (page - 1) * limit)
    files = query.order_by(FileModel.upload_started.desc()).offset(offset).limit(limit).all()
    return FileListResponse(
        items=[_file_to_schema(f) for f in files],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{file_id}", response_model=FileDetailSchema)
async def get_file(
    file_id: str,
    db: Session = Depends(get_db),
    _kek: bytes = Depends(require_kek),
):
    f = _get_file_or_404(db, file_id)
    schema = _file_to_schema(f)
    return FileDetailSchema(
        **schema.model_dump(),
        chunks=[ChunkSchema.model_validate(c) for c in sorted(f.chunks, key=lambda c: c.chunk_index)],
    )


@router.post("/upload", response_model=FileSchema)
async def upload_file(
    file: UploadFile = File(...),
    tags: str = Form(""),
    description: str = Form(""),
    db: Session = Depends(get_db),
    kek: bytes = Depends(require_kek),
):
    """Upload a file: chunk, encrypt, store on Telegram."""
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    tmp_path = save_upload_to_temp(file.filename or "upload.bin", content)
    mime_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"

    file_record = FileModel(
        original_name=file.filename or "upload.bin",
        size_bytes=len(content),
        mime_type=mime_type,
        description=description or None,
        encrypted_aes_key=b"",
        encrypted_hmac_key=b"",
        kek_salt=b"",
        total_chunks=0,
        upload_status="pending",
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    try:
        file_record = await process_upload(db, file_record, tmp_path, kek, tag_list)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}") from exc

    return _file_to_schema(file_record)


@router.patch("/{file_id}", response_model=FileSchema)
async def update_file(
    file_id: str,
    body: UpdateFileRequest,
    db: Session = Depends(get_db),
    _kek: bytes = Depends(require_kek),
):
    f = _get_file_or_404(db, file_id)
    if body.description is not None:
        f.description = body.description
    if body.tags is not None:
        db.query(FileTag).filter(FileTag.file_id == file_id).delete()
        for tag in body.tags:
            db.add(FileTag(file_id=file_id, tag=tag))
    db.commit()
    db.refresh(f)
    return _file_to_schema(f)


@router.delete("/{file_id}", status_code=204)
async def delete_file(
    file_id: str,
    hard: bool = False,
    db: Session = Depends(get_db),
    _kek: bytes = Depends(require_kek),
):
    f = _get_file_or_404(db, file_id)
    if hard:
        from app.core.telegram_client import delete_chunk

        for chunk in f.chunks:
            if chunk.telegram_message_id:
                try:
                    await delete_chunk(chunk.telegram_message_id)
                except Exception:
                    pass
        db.delete(f)
    else:
        f.is_deleted = True
        f.deleted_at = datetime.utcnow()
    db.commit()


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    db: Session = Depends(get_db),
    kek: bytes = Depends(require_kek),
):
    """Download and decrypt file from Telegram chunks."""
    f = _get_file_or_404(db, file_id)
    if f.upload_status != "complete":
        raise HTTPException(status_code=409, detail="File upload is not complete yet")

    try:
        data = await reassemble_file(f, kek, db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Download failed: {exc}") from exc

    return Response(
        content=data,
        media_type=f.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{f.original_name}"',
            "Content-Length": str(len(data)),
        },
    )


@router.post("/{file_id}/resume", status_code=202)
async def resume_upload(
    file_id: str,
    db: Session = Depends(get_db),
    _kek: bytes = Depends(require_kek),
):
    return {"file_id": file_id, "status": "resuming"}
