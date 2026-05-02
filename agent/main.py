from __future__ import annotations

import argparse
import asyncio
import logging

from agent.config.settings import AgentSettings
from agent.recorder.screen import ScreenRecorder
from agent.tracker.activity import ActivityTracker
from agent.uploader.client import AgentApiClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("agent")


async def activity_loop(client: AgentApiClient, tracker: ActivityTracker, interval: int) -> None:
    while True:
        samples = [tracker.sample()]
        try:
            result = await client.send_activity(samples)
            logger.info("activity sent: %s", result.get("processed_count"))
            await client.heartbeat("idle" if samples[-1].is_idle else "active")
        except Exception as exc:
            logger.warning("activity upload failed: %s", exc)
        await asyncio.sleep(interval)


async def recording_loop(client: AgentApiClient, recorder: ScreenRecorder, session_id: str) -> None:
    while True:
        try:
            path = await recorder.record_chunk()
            if path:
                await client.send_recording_metadata(session_id, path, recorder.chunk_seconds)
                logger.info("recording metadata sent: %s", path)
            else:
                logger.warning("recording skipped: install mss and imageio[ffmpeg] to enable capture")
                await asyncio.sleep(recorder.chunk_seconds)
        except Exception as exc:
            logger.warning("recording failed: %s", exc)


async def main() -> None:
    parser = argparse.ArgumentParser(description="AI Workforce Monitoring desktop agent")
    parser.add_argument("--token", required=True, help="Device JWT returned by /auth/verify-code")
    parser.add_argument("--device-id", required=True, help="Device id returned by /auth/verify-code")
    parser.add_argument("--session-id", required=True, help="Session id returned by /auth/verify-code")
    parser.add_argument("--no-recording", action="store_true", help="Run activity tracking only")
    args = parser.parse_args()

    settings = AgentSettings.from_env()
    if not settings.agent_api_key:
        raise RuntimeError("AGENT_API_KEY must be set")

    client = AgentApiClient(settings, args.token)
    tracker = ActivityTracker(settings.idle_threshold_seconds)
    tasks = [asyncio.create_task(activity_loop(client, tracker, settings.batch_interval_seconds))]

    if not args.no_recording:
        recorder = ScreenRecorder(settings.storage_path, args.device_id, settings.recording_chunk_seconds)
        tasks.append(asyncio.create_task(recording_loop(client, recorder, args.session_id)))

    try:
        await asyncio.gather(*tasks)
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
