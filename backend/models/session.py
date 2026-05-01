import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from backend.database.base_class import Base

class Session(Base):
    __tablename__ = "sessions"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("idx_sessions_device_active", "device_id", "is_active"),
    )
