from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class AgentSettings:
    api_base_url: str
    websocket_url: str
    agent_api_key: str
    storage_path: Path
    recording_chunk_seconds: int
    batch_interval_seconds: int = 5
    idle_threshold_seconds: int = 60

    @classmethod
    def from_env(cls) -> "AgentSettings":
        return cls(
            api_base_url=os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/"),
            websocket_url=os.getenv("WEBSOCKET_URL", "ws://localhost:8000/ws"),
            agent_api_key=os.getenv("AGENT_API_KEY", ""),
            storage_path=Path(os.getenv("STORAGE_PATH", "./storage/recordings")),
            recording_chunk_seconds=int(os.getenv("RECORDING_CHUNK_SECONDS", "30")),
        )

    @property
    def api_v1_url(self) -> str:
        if self.api_base_url.endswith("/api/v1"):
            return self.api_base_url
        return f"{self.api_base_url}/api/v1"
