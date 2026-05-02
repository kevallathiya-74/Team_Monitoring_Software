from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from pathlib import Path


class ScreenRecorder:
    def __init__(self, storage_path: Path, device_id: str, chunk_seconds: int) -> None:
        self.storage_path = storage_path
        self.device_id = device_id
        self.chunk_seconds = chunk_seconds

    async def record_chunk(self) -> Path | None:
        try:
            import imageio.v2 as imageio
            import mss
            import numpy as np
        except ImportError:
            return None

        target_dir = self.storage_path / self.device_id
        target_dir.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        target = target_dir / f"{stamp}.mp4"

        fps = 5
        frames = max(1, self.chunk_seconds * fps)
        with mss.mss() as capture, imageio.get_writer(target, fps=fps, codec="libx264", quality=6) as writer:
            monitor = capture.monitors[1]
            for _ in range(frames):
                shot = capture.grab(monitor)
                frame = np.asarray(shot)[:, :, :3]
                writer.append_data(frame)
                await asyncio.sleep(1 / fps)
        return target
