from typing import List
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.api import deps
from backend.models.user import User
from backend.models.device import Device
from backend.models.session import Session
from backend.schemas.device import Device as DeviceSchema, DeviceHeartbeat, DeviceStatus

router = APIRouter()

@router.get("/", response_model=List[DeviceSchema])
async def read_devices(
    db: AsyncSession = Depends(deps.get_db),
    # Require admin access to list all devices
    current_user: User = Depends(deps.get_current_user)
):
    stmt = select(Device)
    result = await db.execute(stmt)
    devices = result.scalars().all()
    return devices

@router.get("/{device_id}", response_model=DeviceSchema)
async def read_device(
    device_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin)
):
    stmt = select(Device).where(Device.id == device_id)
    result = await db.execute(stmt)
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.post("/heartbeat", response_model=DeviceStatus, dependencies=[Depends(deps.verify_agent_key)])
async def heartbeat(
    payload: DeviceHeartbeat,
    db: AsyncSession = Depends(deps.get_db),
    current_device: Device = Depends(deps.get_current_device)
):
    normalized_status = payload.status.lower().strip()
    if normalized_status not in {"active", "idle", "inactive"}:
        raise HTTPException(status_code=422, detail="status must be active, idle, or inactive")

    current_device.last_seen_at = datetime.utcnow()
    current_device.is_active = normalized_status != "inactive"
    db.add(current_device)

    if normalized_status == "inactive":
        stmt = select(Session).where(
            Session.device_id == current_device.id,
            Session.is_active == True
        )
        result = await db.execute(stmt)
        active_session = result.scalars().first()
        if active_session:
            active_session.is_active = False
            active_session.ended_at = datetime.utcnow()
            db.add(active_session)

    await db.commit()
    await db.refresh(current_device)
    return current_device
