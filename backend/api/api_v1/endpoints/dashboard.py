from typing import List, Optional
from datetime import datetime, timedelta
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.api import deps
from backend.models.user import User
from backend.models.device import Device
from backend.models.activity import ActivityLog
from backend.models.recording import Recording
from backend.schemas.activity import ActivityLogCreate
from backend.schemas.recording import RecordingResponse

router = APIRouter()

@router.get("/devices")
async def get_dashboard_devices(
    db: AsyncSession = Depends(deps.get_db),
    admin: User = Depends(deps.get_current_admin)
):
    stmt = select(Device).order_by(desc(Device.last_seen_at))
    result = await db.execute(stmt)
    devices = result.scalars().all()
    
    now = datetime.utcnow()
    
    response = []
    for d in devices:
        is_online = (now - d.last_seen_at).total_seconds() < 300
        response.append({
            "id": d.id,
            "hostname": d.hostname,
            "local_ip": d.local_ip,
            "last_seen_at": d.last_seen_at,
            "is_online": is_online
        })
    return response

@router.get("/device/{device_id}/timeline")
async def get_device_timeline(
    device_id: uuid.UUID,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: AsyncSession = Depends(deps.get_db),
    admin: User = Depends(deps.get_current_admin)
):
    if not start_time:
        start_time = datetime.utcnow() - timedelta(hours=24)
    if not end_time:
        end_time = datetime.utcnow()
        
    start_time = start_time.replace(tzinfo=None) if start_time.tzinfo else start_time
    end_time = end_time.replace(tzinfo=None) if end_time.tzinfo else end_time
        
    stmt = select(ActivityLog).where(
        ActivityLog.device_id == device_id,
        ActivityLog.timestamp >= start_time,
        ActivityLog.timestamp <= end_time
    ).order_by(ActivityLog.timestamp)
    
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    return logs

@router.get("/device/{device_id}/recordings", response_model=List[RecordingResponse])
async def get_device_recordings(
    device_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(deps.get_db),
    admin: User = Depends(deps.get_current_admin)
):
    stmt = select(Recording).where(
        Recording.device_id == device_id
    ).order_by(desc(Recording.start_time)).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    recordings = result.scalars().all()
    
    return recordings
