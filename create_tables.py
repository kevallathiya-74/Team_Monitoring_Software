import asyncio
from backend.database.engine import engine
from backend.database.base_class import Base
import backend.models

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    asyncio.run(create_tables())
