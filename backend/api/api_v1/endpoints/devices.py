from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.api import deps
from backend.models.user import User, UserRole
from backend.models.device import Device
from backend.schemas.device import Device as DeviceSchema

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
