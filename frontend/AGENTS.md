# AGENT.md
## AI Workforce Monitoring – Agent System Specification

This file defines the architecture, behavior, and execution rules for the desktop agent.

--------------------------------------------------

## 🎯 PURPOSE

The Agent is responsible for:

- Tracking user activity (apps, windows, idle time)
- Recording screen (local only)
- Sending data to backend API
- Maintaining real-time connection
- Handling LAN + Cloud connectivity

--------------------------------------------------

## 🧱 MODULE STRUCTURE

agent/
 ├── core/
 ├── tracker/
 ├── recorder/
 ├── network/
 ├── uploader/
 ├── config/
 └── main.py

--------------------------------------------------

## ⚙️ CONFIGURATION

Loaded from environment:

- API_BASE_URL
- WEBSOCKET_URL
- AGENT_API_KEY
- STORAGE_PATH
- RECORDING_CHUNK_SECONDS
- LAN_DISCOVERY_PORT
- LAN_BROADCAST_INTERVAL

--------------------------------------------------

## 🔐 AUTHENTICATION

Agent must include:

Headers:
Authorization: Bearer <DEVICE_JWT>
X-Agent-Key: <AGENT_API_KEY>

If invalid → backend rejects request.

--------------------------------------------------

## 📊 TRACKER MODULE

Responsibilities:

- Detect active application
- Capture window title
- Detect idle state (no input activity)
- Track duration

Output format:

{
  "app_name": "Chrome",
  "window_title": "YouTube",
  "is_idle": false,
  "timestamp": "ISO",
  "duration": 5
}

Send in batch every 3–5 seconds.

--------------------------------------------------

## 🎥 RECORDER MODULE

Rules:

- Record screen in chunks (default 30 sec)
- Save locally ONLY
- Format: mp4

Storage path:

/storage/recordings/{device_id}/{timestamp}.mp4

Constraints:

- Do NOT upload video
- Compress recording
- Handle crash recovery

--------------------------------------------------

## 🌐 NETWORK MODULE

Behavior:

1. Try LAN discovery:
   - UDP broadcast on LAN_DISCOVERY_PORT
   - Wait for backend response

2. If found:
   - Use local IP

3. Else:
   - Use cloud API_BASE_URL

4. Retry every interval

--------------------------------------------------

## 🔁 UPLOADER MODULE

Responsibilities:

- Send activity data
- Send recording metadata
- Send heartbeat

Endpoints:

- POST /activity/batch
- POST /recordings/metadata
- POST /devices/heartbeat

Retry logic:

- exponential backoff
- queue failed requests

--------------------------------------------------

## ❤️ HEARTBEAT SYSTEM

- Send every 5–10 seconds
- Update device status

Payload:

{
  "device_id": "...",
  "status": "active"
}

--------------------------------------------------

## ⚠️ ERROR HANDLING

Agent must handle:

- network failure
- API timeout
- disk full
- recording crash

Never crash silently.

--------------------------------------------------

## 🧪 TEST CHECKLIST

- Agent starts successfully
- Activity logs reach backend
- Recording files are created
- Metadata saved in DB
- Heartbeat updates device status

--------------------------------------------------

## 🚫 RESTRICTIONS

- No hardcoded URLs
- No fake data
- No skipped modules
- No direct DB access (API only)

--------------------------------------------------

## ✅ SUCCESS CONDITION

Agent is considered complete when:

Agent → API → DB → Frontend → Realtime

is fully working with real data.