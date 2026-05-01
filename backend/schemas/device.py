from datetime import datetime
import uuid
from typing import Optional
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
