from __future__ import annotations

import ctypes
import os
import platform
import time
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class ActivitySample:
    timestamp: datetime
    app_name: str
    window_title: str | None
    is_idle: bool
    duration_seconds: int

    def to_payload(self) -> dict:
        return {
            "timestamp": self.timestamp.isoformat(),
            "app_name": self.app_name,
            "window_title": self.window_title,
            "is_idle": self.is_idle,
            "duration_seconds": self.duration_seconds,
        }


class ActivityTracker:
    def __init__(self, idle_threshold_seconds: int = 60) -> None:
        self.idle_threshold_seconds = idle_threshold_seconds
        self._last_sample_at = time.monotonic()

    def sample(self) -> ActivitySample:
        now = time.monotonic()
        duration = max(1, int(now - self._last_sample_at))
        self._last_sample_at = now
        app_name, title = self._active_window()
        idle_seconds = self._idle_seconds()
        return ActivitySample(
            timestamp=datetime.now(timezone.utc),
            app_name=app_name,
            window_title=title,
            is_idle=idle_seconds >= self.idle_threshold_seconds,
            duration_seconds=duration,
        )

    def _active_window(self) -> tuple[str, str | None]:
        if platform.system() != "Windows":
            return platform.system() or "Unknown", None

        try:
            import psutil
            import win32gui
            import win32process

            hwnd = win32gui.GetForegroundWindow()
            title = win32gui.GetWindowText(hwnd) or None
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            process = psutil.Process(pid)
            return process.name(), title
        except Exception:
            return "Unknown", None

    def _idle_seconds(self) -> int:
        if platform.system() != "Windows":
            return 0

        class LASTINPUTINFO(ctypes.Structure):
            _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]

        last_input = LASTINPUTINFO()
        last_input.cbSize = ctypes.sizeof(last_input)
        if not ctypes.windll.user32.GetLastInputInfo(ctypes.byref(last_input)):
            return 0
        millis = ctypes.windll.kernel32.GetTickCount() - last_input.dwTime
        return max(0, int(millis / 1000))
