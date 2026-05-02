from datetime import datetime
import uuid
from pydantic import BaseModel

class DeviceBase(BaseModel):
    hostname: str
    local_ip: str

class DeviceCreate(DeviceBase):
    pass

class Device(DeviceBase):
    id: uuid.UUID
    user_id: uuid.UUID
    last_seen_at: datetime
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class DeviceHeartbeat(BaseModel):
    status: str = "active"

class DeviceStatus(BaseModel):
    id: uuid.UUID
    last_seen_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}
