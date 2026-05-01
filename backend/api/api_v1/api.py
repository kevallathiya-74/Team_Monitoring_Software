from fastapi import APIRouter
from backend.api.api_v1.endpoints import health, auth, devices, sessions, activity, media, dashboard

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(devices.router, prefix="/devices", tags=["devices"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(activity.router, prefix="/activity", tags=["activity"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
