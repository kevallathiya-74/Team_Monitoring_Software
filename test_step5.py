import httpx
import asyncio
import os
from datetime import datetime

async def test_step5():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1", timeout=30.0) as client:
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
            "hostname": "Test-PC-Step5",
            "local_ip": "192.168.1.103"
        }
        verify_resp = await client.post("/auth/verify-code", json=verify_payload)
        device_token = verify_resp.json()["access_token"]
        
        print("\n4. Start Session...")
        headers = {"Authorization": f"Bearer {device_token}"}
        start_resp = await client.post("/sessions/start", headers=headers)
        session_id = start_resp.json()["id"]
        print(f"Session ID: {session_id}")
        
        print("\n5. Upload Screenshot...")
        # Create a dummy image file
        with open("dummy.png", "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR...")
            
        now = datetime.utcnow()
        
        files = {
            'file': ('dummy.png', open('dummy.png', 'rb'), 'image/png')
        }
        data = {
            'session_id': session_id,
            'start_time': now.isoformat() + "Z",
            'duration_seconds': 0,
            'media_type': 'screenshot'
        }
        
        upload_resp = await client.post("/media/upload", headers=headers, data=data, files=files)
        print(f"Upload Response ({upload_resp.status_code}): {upload_resp.text}")
        
        # Clean up
        os.remove("dummy.png")

if __name__ == "__main__":
    asyncio.run(test_step5())
