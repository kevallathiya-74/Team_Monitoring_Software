import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, ForeignKey, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column
from backend.database.base_class import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    app_name: Mapped[str] = mapped_column(String(255), nullable=False)
    window_title: Mapped[str] = mapped_column(String(512), nullable=True)
    is_idle: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (
        Index("idx_activity_device_time", "device_id", "timestamp"),
    )
