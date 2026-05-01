import httpx
import asyncio
from datetime import datetime, timedelta

async def test_step4():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1", timeout=30.0) as client:
        # We need a device token, so we'll just quickly generate and verify a code
        print("1. Admin Login...")
        login_resp = await client.post("/auth/admin/login", json={"email": "admin@example.com", "password": "admin123"})
        if login_resp.status_code != 200:
            print("Admin login failed", login_resp.text)
            return
            
        print("\n2. Generate Code...")
        gen_resp = await client.post("/auth/generate-code")
        code = gen_resp.json()["code"]
        
        print("\n3. Verify Code (Registers Device)...")
        verify_payload = {
            "code": code,
            "hostname": "Test-PC-Step4",
            "local_ip": "192.168.1.102"
        }
        verify_resp = await client.post("/auth/verify-code", json=verify_payload)
        device_token = verify_resp.json()["access_token"]
        
        print("\n4. Sending Activity Batch...")
        headers = {"Authorization": f"Bearer {device_token}"}
        
        now = datetime.utcnow()
        batch_payload = {
            "logs": [
                {
                    "timestamp": (now - timedelta(seconds=60)).isoformat() + "Z",
                    "app_name": "VS Code",
                    "window_title": "backend/models/activity.py",
                    "is_idle": False,
                    "duration_seconds": 30
                },
                {
                    "timestamp": (now - timedelta(seconds=30)).isoformat() + "Z",
                    "app_name": "Google Chrome",
                    "window_title": "StackOverflow - Python asyncio",
                    "is_idle": False,
                    "duration_seconds": 15
                },
                {
                    "timestamp": now.isoformat() + "Z",
                    "app_name": "System",
                    "window_title": "Lock Screen",
                    "is_idle": True,
                    "duration_seconds": 15
                }
            ]
        }
        
        batch_resp = await client.post("/activity/batch", json=batch_payload, headers=headers)
        print(f"Batch Response ({batch_resp.status_code}): {batch_resp.text}")

if __name__ == "__main__":
    asyncio.run(test_step4())
