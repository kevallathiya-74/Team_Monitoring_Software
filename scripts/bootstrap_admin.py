from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from backend.core.config import settings
from backend.core.security import get_password_hash
from backend.database.engine import AsyncSessionLocal, engine
from backend.database.base_class import Base
from backend.models.user import User, UserRole
import backend.models


async def bootstrap_admin(email: str, password: str) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            user.role = UserRole.admin
            user.hashed_password = get_password_hash(password)
            if not user.name:
                user.name = "Admin"
            print(f"Updated admin user: {email}")
        else:
            db.add(User(
                email=email,
                hashed_password=get_password_hash(password),
                role=UserRole.admin,
                name="Admin",
            ))
            print(f"Created admin user: {email}")
        await db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or update the initial admin account.")
    parser.add_argument("--email", default=settings.ADMIN_EMAIL)
    parser.add_argument("--password", default=settings.ADMIN_PASSWORD)
    args = parser.parse_args()
    if not args.password:
        raise SystemExit("Provide --password or set ADMIN_PASSWORD in .env")
    asyncio.run(bootstrap_admin(args.email, args.password))


if __name__ == "__main__":
    main()
