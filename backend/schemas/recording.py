import uuid
from datetime import datetime
from pydantic import BaseModel
from backend.models.recording import MediaType

class RecordingMetadataCreate(BaseModel):
    session_id: uuid.UUID
    file_path: str
    start_time: datetime
    duration_seconds: int
    media_type: MediaType = MediaType.video

class RecordingResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    device_id: uuid.UUID
    file_path: str
    start_time: datetime
    duration_seconds: int
    media_type: MediaType
    created_at: datetime

    model_config = {"from_attributes": True}
