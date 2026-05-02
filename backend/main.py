import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.api.api_v1.api import api_router
from backend.database.engine import engine
from backend.database.base_class import Base
from sqlalchemy import select

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    try:
        import backend.models  # Import models to ensure they are registered
        async with engine.begin() as conn:
            # Create all tables if they don't exist
            await conn.run_sync(Base.metadata.create_all)
        if settings.ADMIN_PASSWORD:
            from backend.database.engine import AsyncSessionLocal
            from backend.models.user import User, UserRole
            from backend.core.security import get_password_hash

            async with AsyncSessionLocal() as db:
                result = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
                admin = result.scalar_one_or_none()
                if not admin:
                    db.add(User(
                        email=settings.ADMIN_EMAIL,
                        hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                        role=UserRole.admin,
                        name="Admin",
                    ))
                    await db.commit()
                    logger.info("Bootstrap admin user created.")
        logger.info("Database initialized.")
    except Exception as e:
        logger.error(f"Could not connect to the database: {e}")
        # We don't raise here so the app can still start up and be debugged,
        # but in production you might want it to fail fast.
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API."}
