from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class ActivityLogCreate(BaseModel):
    timestamp: datetime
    app_name: str
    window_title: Optional[str] = None
    is_idle: bool
    duration_seconds: int

class ActivityBatchCreate(BaseModel):
    logs: List[ActivityLogCreate]
