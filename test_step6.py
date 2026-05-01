import httpx
import asyncio

async def test_step6():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1", timeout=30.0) as client:
        print("1. Admin Login...")
        login_resp = await client.post("/auth/admin/login", json={"email": "admin@example.com", "password": "admin123"})
        if login_resp.status_code != 200:
            print("Admin login failed", login_resp.text)
            return
            
        admin_token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        print("\n2. Fetching Dashboard Devices...")
        devices_resp = await client.get("/dashboard/devices", headers=headers)
        print(f"Dashboard Devices ({devices_resp.status_code}): {devices_resp.text}")
        
        devices = devices_resp.json()
        if not devices:
            print("No devices found to query further.")
            return
            
        device_id = devices[0]["id"]
        
        print(f"\n3. Fetching Timeline for Device {device_id}...")
        timeline_resp = await client.get(f"/dashboard/device/{device_id}/timeline", headers=headers)
        print(f"Timeline ({timeline_resp.status_code}): {len(timeline_resp.json())} logs found.")
        
        print(f"\n4. Fetching Recordings for Device {device_id}...")
        rec_resp = await client.get(f"/dashboard/device/{device_id}/recordings", headers=headers)
        print(f"Recordings ({rec_resp.status_code}): {len(rec_resp.json())} recordings found.")

if __name__ == "__main__":
    asyncio.run(test_step6())
