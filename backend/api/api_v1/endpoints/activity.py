from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api import deps
from backend.models.device import Device
from backend.models.activity import ActivityLog
from backend.schemas.activity import ActivityBatchCreate

router = APIRouter()

@router.post("/batch")
async def create_activity_batch(
    payload: ActivityBatchCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_device: Device = Depends(deps.get_current_device)
):
    try:
        activity_logs = []
        active_duration = 0
        idle_duration = 0
        
        for log_data in payload.logs:
            ts = log_data.timestamp.replace(tzinfo=None) if log_data.timestamp.tzinfo else log_data.timestamp
            
            log = ActivityLog(
                device_id=current_device.id,
                timestamp=ts,
                app_name=log_data.app_name,
                window_title=log_data.window_title,
                is_idle=log_data.is_idle,
                duration_seconds=log_data.duration_seconds
            )
            activity_logs.append(log)
            
            if log_data.is_idle:
                idle_duration += log_data.duration_seconds
            else:
                active_duration += log_data.duration_seconds
                
        db.add_all(activity_logs)
        current_device.last_seen_at = datetime.utcnow()
        db.add(current_device)
        await db.commit()
        
        return {
            "status": "success",
            "processed_count": len(activity_logs),
            "computed_durations": {
                "active_seconds": active_duration,
                "idle_seconds": idle_duration
            }
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}
