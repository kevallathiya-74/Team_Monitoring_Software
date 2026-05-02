from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path

import httpx


def load_dotenv() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


load_dotenv()

BASE_URL = os.getenv("API_TEST_BASE_URL", "http://127.0.0.1:8000/api/v1")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
AGENT_API_KEY = os.getenv("AGENT_API_KEY", "")


def show(label: str, response: httpx.Response) -> None:
    print(f"{label}: {response.status_code} {response.text[:500]}")
    response.raise_for_status()


def main() -> None:
    with httpx.Client(base_url=BASE_URL, timeout=30) as client:
        show("health", client.get("/health/"))

        login = client.post(
            "/auth/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        show("admin login", login)
        admin_token = login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        code_response = client.post("/auth/generate-code", headers=admin_headers)
        show("generate code", code_response)
        code = code_response.json()["code"]

        verify = client.post(
            "/auth/verify-code",
            json={"code": code, "hostname": "Smoke-PC", "local_ip": "127.0.0.1"},
        )
        show("verify code", verify)
        device_auth = verify.json()

        device_headers = {
            "Authorization": f"Bearer {device_auth['access_token']}",
            "X-Agent-Key": AGENT_API_KEY,
        }

        show("heartbeat", client.post("/devices/heartbeat", headers=device_headers, json={"status": "active"}))

        now = datetime.now(timezone.utc).isoformat()
        activity = client.post(
            "/activity/batch",
            headers=device_headers,
            json={
                "logs": [
                    {
                        "timestamp": now,
                        "app_name": "Smoke Test",
                        "window_title": "API check",
                        "is_idle": False,
                        "duration_seconds": 5,
                    }
                ]
            },
        )
        show("activity", activity)

        recording = client.post(
            "/recordings/metadata",
            headers=device_headers,
            json={
                "session_id": device_auth["session_id"],
                "file_path": "./storage/recordings/smoke.mp4",
                "start_time": now,
                "duration_seconds": 5,
                "media_type": "video",
            },
        )
        show("recording metadata", recording)

        show("dashboard devices", client.get("/dashboard/devices", headers=admin_headers))


if __name__ == "__main__":
    main()
