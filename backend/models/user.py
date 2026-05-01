import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from backend.database.base_class import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    employee = "employee"

class User(Base):
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.employee, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # For Admin login
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
