from datetime import datetime
import uuid
from typing import Optional
from pydantic import BaseModel

class SessionBase(BaseModel):
    pass

class SessionCreate(SessionBase):
    pass

class Session(SessionBase):
    id: uuid.UUID
    device_id: uuid.UUID
    started_at: datetime
    ended_at: Optional[datetime] = None
    is_active: bool

    model_config = {"from_attributes": True}
