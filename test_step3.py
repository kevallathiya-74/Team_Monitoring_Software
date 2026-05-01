import httpx
import asyncio

async def test_step3():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1") as client:
        print("1. Admin Login...")
        login_resp = await client.post("/auth/admin/login", json={"email": "admin@example.com", "password": "admin123"})
        print(f"Admin Login ({login_resp.status_code}): {login_resp.text}")
        if login_resp.status_code != 200:
            return
        admin_token = login_resp.json()["access_token"]
        
        print("\n2. Generate Code...")
        gen_resp = await client.post("/auth/generate-code")
        print(f"Generate Code ({gen_resp.status_code}): {gen_resp.text}")
        if gen_resp.status_code != 200:
            return
        code = gen_resp.json()["code"]
        
        print("\n3. Verify Code (Registers Device)...")
        verify_payload = {
            "code": code,
            "hostname": "Test-PC-Step3",
            "local_ip": "192.168.1.101"
        }
        verify_resp = await client.post("/auth/verify-code", json=verify_payload)
        print(f"Verify Code ({verify_resp.status_code}): {verify_resp.text}")
        if verify_resp.status_code != 200:
            return
        device_token = verify_resp.json()["access_token"]
        
        print("\n4. Start Session...")
        headers = {"Authorization": f"Bearer {device_token}"}
        start_resp = await client.post("/sessions/start", headers=headers)
        print(f"Start Session ({start_resp.status_code}): {start_resp.text}")
        
        print("\n5. Stop Session...")
        stop_resp = await client.post("/sessions/stop", headers=headers)
        print(f"Stop Session ({stop_resp.status_code}): {stop_resp.text}")
        
        print("\n6. List Devices (Admin)...")
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        list_resp = await client.get("/devices/", headers=admin_headers)
        print(f"List Devices ({list_resp.status_code}): {list_resp.text}")

if __name__ == "__main__":
    asyncio.run(test_step3())
