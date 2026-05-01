import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column
from backend.database.base_class import Base
import enum

class MediaType(str, enum.Enum):
    screenshot = "screenshot"
    video = "video"

class Recording(Base):
    __tablename__ = "recordings"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sessions.id"), nullable=False)
    device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id"), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    media_type: Mapped[MediaType] = mapped_column(Enum(MediaType), default=MediaType.screenshot, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
