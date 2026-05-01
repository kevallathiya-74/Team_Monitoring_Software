import asyncio
from backend.main import app, lifespan

async def test():
    print("Testing DB connection...")
    async with lifespan(app):
        print("Lifespan completed successfully!")

if __name__ == "__main__":
    asyncio.run(test())
