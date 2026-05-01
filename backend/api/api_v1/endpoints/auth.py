from datetime import datetime, timedelta
import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.api import deps
from backend.core import security
from backend.core.config import settings
from backend.models.user import User, UserRole
from backend.models.auth_code import AuthCode
from backend.schemas.auth import AdminLogin, Token, CodeResponse, VerifyCode

router = APIRouter()

@router.post("/admin/login", response_model=Token)
async def login_admin(
    login_data: AdminLogin,
    db: AsyncSession = Depends(deps.get_db)
):
    stmt = select(User).where(User.email == login_data.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not user.hashed_password or not security.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not an admin")
        
    access_token_expires = timedelta(minutes=60)
    access_token = security.create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/generate-code", response_model=CodeResponse)
async def generate_code(
    # In a real app we'd require an admin JWT here
    db: AsyncSession = Depends(deps.get_db)
):
    # For MVP, we might not strictly enforce the admin dependency until we wire up the UI,
    # but let's assume we have an admin user in the DB to associate with.
    # We will just fetch the first admin or create one if none exists (for MVP bootstrap).
    stmt = select(User).where(User.role == UserRole.admin)
    result = await db.execute(stmt)
    admin_user = result.scalars().first()
    
    if not admin_user:
        # Bootstrap an admin user if missing
        admin_user = User(
            email="admin@example.com",
            hashed_password=security.get_password_hash("admin123"),
            role=UserRole.admin
        )
        db.add(admin_user)
        await db.commit()
        await db.refresh(admin_user)

    # Generate a 6-digit code
    code_str = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(seconds=settings.CODE_TTL_SECONDS)
    
    auth_code = AuthCode(
        code=code_str,
        created_by_admin_id=admin_user.id,
        expires_at=expires_at
    )
    db.add(auth_code)
    await db.commit()
    
    return CodeResponse(code=code_str, expires_in_seconds=settings.CODE_TTL_SECONDS)

@router.post("/verify-code", response_model=Token)
async def verify_code(
    payload: VerifyCode,
    db: AsyncSession = Depends(deps.get_db)
):
    stmt = select(AuthCode).where(AuthCode.code == payload.code)
    result = await db.execute(stmt)
    auth_code = result.scalar_one_or_none()
    
    if not auth_code:
        raise HTTPException(status_code=404, detail="Code not found")
        
    if auth_code.is_used:
        raise HTTPException(status_code=400, detail="Code already used")
        
    if datetime.utcnow() > auth_code.expires_at:
        raise HTTPException(status_code=400, detail="Code expired")
        
    # Mark as used
    auth_code.is_used = True
    
    # In Step 3 we register the device here.
    
    # Create or get a generic employee user
    stmt_emp = select(User).where(User.role == UserRole.employee)
    result_emp = await db.execute(stmt_emp)
    employee = result_emp.scalars().first()
    
    if not employee:
        employee = User(
            role=UserRole.employee,
            name=f"Employee {payload.hostname}"
        )
        db.add(employee)
        await db.commit()
        await db.refresh(employee)

    # Register the device
    from backend.models.device import Device
    
    device = Device(
        user_id=employee.id,
        hostname=payload.hostname,
        local_ip=payload.local_ip
    )
    db.add(device)
    await db.commit()
    await db.refresh(device)

    # Return JWT scoped with device_id
    access_token = security.create_access_token(
        subject=str(employee.id),
        additional_claims={"device_id": str(device.id)},
        expires_delta=timedelta(days=365) # Long-lived for devices
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
