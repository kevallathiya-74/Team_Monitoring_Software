from __future__ import annotations

import socket
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import httpx

from agent.config.settings import AgentSettings
from agent.tracker.activity import ActivitySample


class AgentApiClient:
    def __init__(self, settings: AgentSettings, device_token: str) -> None:
        self.settings = settings
        self.device_token = device_token
        self._client = httpx.AsyncClient(
            base_url=settings.api_v1_url,
            timeout=15,
            headers={
                "Authorization": f"Bearer {device_token}",
                "X-Agent-Key": settings.agent_api_key,
            },
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def send_activity(self, samples: Iterable[ActivitySample]) -> dict:
        payload = {"logs": [sample.to_payload() for sample in samples]}
        response = await self._client.post("/activity/batch", json=payload)
        response.raise_for_status()
        return response.json()

    async def heartbeat(self, status: str = "active") -> dict:
        response = await self._client.post("/devices/heartbeat", json={"status": status})
        response.raise_for_status()
        return response.json()

    async def send_recording_metadata(
        self,
        session_id: str,
        file_path: Path,
        duration_seconds: int,
    ) -> dict:
        response = await self._client.post(
            "/recordings/metadata",
            json={
                "session_id": session_id,
                "file_path": str(file_path),
                "start_time": datetime.now(timezone.utc).isoformat(),
                "duration_seconds": duration_seconds,
                "media_type": "video",
            },
        )
        response.raise_for_status()
        return response.json()


def local_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"
