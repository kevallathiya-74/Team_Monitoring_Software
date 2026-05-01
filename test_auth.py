import httpx
import asyncio

async def test_auth():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1") as client:
        print("1. Generating auth code (this will bootstrap the admin user if needed)...")
        # Since we didn't enforce admin dependency yet in generate-code, we can just call it
        response = await client.post("/auth/generate-code")
        print(f"Generate Code Response ({response.status_code}): {response.json()}")
        
        if response.status_code == 200:
            code = response.json()["code"]
            
            print("\n2. Verifying the generated code...")
            verify_payload = {
                "code": code,
                "hostname": "Test-PC",
                "local_ip": "192.168.1.100"
            }
            verify_resp = await client.post("/auth/verify-code", json=verify_payload)
            print(f"Verify Code Response ({verify_resp.status_code}): {verify_resp.json()}")

            print("\n3. Testing Admin Login...")
            login_payload = {
                "email": "admin@example.com",
                "password": "admin123"
            }
            login_resp = await client.post("/auth/admin/login", json=login_payload)
            print(f"Admin Login Response ({login_resp.status_code}): {login_resp.json()}")

if __name__ == "__main__":
    asyncio.run(test_auth())
