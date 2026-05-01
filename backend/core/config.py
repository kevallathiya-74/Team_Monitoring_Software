import os
from pydantic import validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Workforce Monitoring & Intelligence Platform"
    API_V1_STR: str = "/api/v1"
    
    # Environment variables
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"

    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: str | None) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql://", 1)
            if v.startswith("postgresql://"):
                v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
            if "sslmode=" in v:
                v = v.replace("sslmode=", "ssl=")
            if "channel_binding=" in v:
                # asyncpg does not support channel_binding
                import re
                v = re.sub(r'[?&]channel_binding=[^&]*', '', v)
        return v
    
    SECRET_KEY: str
    JWT_SECRET: str
    
    API_BASE_URL: str
    WEBSOCKET_URL: str
    
    STORAGE_PATH: str
    
    AGENT_API_KEY: str
    
    LAN_DISCOVERY_PORT: int
    LAN_BROADCAST_INTERVAL: int
    
    RECORDING_CHUNK_SECONDS: int
    MAX_RECORDING_DURATION: int
    
    CODE_TTL_SECONDS: int

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
