from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.api import deps
from backend.models.device import Device
from backend.models.session import Session
from backend.schemas.session import Session as SessionSchema

router = APIRouter()

@router.post("/start", response_model=SessionSchema)
async def start_session(
    db: AsyncSession = Depends(deps.get_db),
    current_device: Device = Depends(deps.get_current_device),
    agent_key: None = Depends(deps.verify_agent_key),
):
    # Ensure no other active session exists for this device
    stmt = select(Session).where(
        Session.device_id == current_device.id,
        Session.is_active == True
    )
    result = await db.execute(stmt)
    existing_session = result.scalars().first()
    
    if existing_session:
        # We could also close the old one automatically, but returning an error is safer for MVP
        existing_session.is_active = False
        existing_session.ended_at = datetime.utcnow()
        db.add(existing_session)

    new_session = Session(
        device_id=current_device.id,
        is_active=True
    )
    db.add(new_session)
    
    # Update device last_seen_at
    current_device.last_seen_at = datetime.utcnow()
    db.add(current_device)
    
    await db.commit()
    await db.refresh(new_session)
    return new_session

@router.post("/stop")
async def stop_session(
    db: AsyncSession = Depends(deps.get_db),
    current_device: Device = Depends(deps.get_current_device),
    agent_key: None = Depends(deps.verify_agent_key),
):
    stmt = select(Session).where(
        Session.device_id == current_device.id,
        Session.is_active == True
    )
    result = await db.execute(stmt)
    active_session = result.scalars().first()
    
    if not active_session:
        raise HTTPException(status_code=400, detail="No active session found")
        
    active_session.is_active = False
    active_session.ended_at = datetime.utcnow()
    db.add(active_session)
    
    # Update device last_seen_at
    current_device.last_seen_at = datetime.utcnow()
    db.add(current_device)
    
    await db.commit()
    return {"status": "success"}
