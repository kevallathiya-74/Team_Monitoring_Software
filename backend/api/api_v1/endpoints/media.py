import os
import uuid
import aiofiles
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.api import deps
from backend.core.config import settings
from backend.models.device import Device
from backend.models.session import Session
from backend.models.recording import Recording, MediaType
from backend.schemas.recording import RecordingMetadataCreate, RecordingResponse

router = APIRouter()

@router.post("/upload", response_model=RecordingResponse)
async def upload_media(
    session_id: uuid.UUID = Form(...),
    start_time: datetime = Form(...),
    duration_seconds: int = Form(...),
    media_type: MediaType = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(deps.get_db),
    current_device: Device = Depends(deps.get_current_device),
    agent_key: None = Depends(deps.verify_agent_key),
):
    # Ensure session belongs to the current device and is valid
    stmt = select(Session).where(
        Session.id == session_id,
        Session.device_id == current_device.id
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or belongs to another device")

    # Ensure start_time is naive for PostgreSQL
    ts = start_time.replace(tzinfo=None) if start_time.tzinfo else start_time

    # Create storage directory if it doesn't exist
    os.makedirs(settings.STORAGE_PATH, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    if not file_extension:
        file_extension = ".mp4" if media_type == MediaType.video else ".png"
        
    unique_filename = f"{current_device.id}_{session_id}_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(settings.STORAGE_PATH, unique_filename)
    
    # Save file asynchronously
    async with aiofiles.open(file_path, 'wb') as out_file:
        while content := await file.read(1024 * 1024):  # read in 1MB chunks
            await out_file.write(content)
            
    # Save record to DB
    recording = Recording(
        session_id=session_id,
        device_id=current_device.id,
        file_path=file_path,
        start_time=ts,
        duration_seconds=duration_seconds,
        media_type=media_type
    )
    db.add(recording)
    
    # Update device heartbeat
    current_device.last_seen_at = datetime.utcnow()
    db.add(current_device)
    
    await db.commit()
    await db.refresh(recording)
    
    return recording

@router.post("/metadata", response_model=RecordingResponse)
async def create_recording_metadata(
    payload: RecordingMetadataCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_device: Device = Depends(deps.get_current_device),
    agent_key: None = Depends(deps.verify_agent_key),
):
    stmt = select(Session).where(
        Session.id == payload.session_id,
        Session.device_id == current_device.id,
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or belongs to another device")

    ts = payload.start_time.replace(tzinfo=None) if payload.start_time.tzinfo else payload.start_time
    recording = Recording(
        session_id=payload.session_id,
        device_id=current_device.id,
        file_path=payload.file_path,
        start_time=ts,
        duration_seconds=payload.duration_seconds,
        media_type=payload.media_type,
    )
    db.add(recording)
    current_device.last_seen_at = datetime.utcnow()
    db.add(current_device)
    await db.commit()
    await db.refresh(recording)
    return recording
