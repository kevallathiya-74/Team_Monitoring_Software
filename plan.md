You are a senior full-stack engineer, system architect, and AI/ML engineer.

Build a production-ready SaaS application:

"AI Workforce Monitoring & Intelligence Platform"

This must be a REAL, end-to-end system with no mocks, no dummy data, and complete connectivity from agent → backend → database → realtime → frontend.

====================================================
🧠 NON-NEGOTIABLE RULES
====================================================

1) MVP-FIRST. Build core features to a stable state before anything advanced.
2) ZERO MOCKS. Every UI uses real APIs and real DB data.
3) AFTER EACH MODULE:
   - run instructions
   - test cases
   - verification steps
   - fix issues before next step
4) If blocked or missing info → ASK USER BEFORE CONTINUING.
5) Clean, modular, maintainable code. No hardcoding secrets.

====================================================
🧱 SYSTEM OVERVIEW
====================================================

Agent (desktop app)
  → LAN (preferred) OR Cloud (fallback)
  → Backend API (FastAPI)
  → PostgreSQL (state + logs)
  → Redis (pub/sub + cache)
  → WebSocket (realtime)
  → Frontend (Next.js)

Local Storage:
  ./storage/recordings/{device_id}/{timestamp}.mp4

====================================================
📦 PROJECT STRUCTURE
====================================================

root/
 ├── backend/
 │    ├── api/                # routers
 │    ├── core/               # config, security, deps
 │    ├── models/             # SQLAlchemy models
 │    ├── schemas/            # Pydantic schemas
 │    ├── services/           # business logic
 │    ├── database/           # engine, session, migrations (alembic optional)
 │    ├── realtime/           # websocket + redis pub/sub
 │    ├── workers/            # background tasks
 │    ├── tests/
 │    ├── main.py
 │    └── requirements.txt
 │
 ├── frontend/
 │    ├── components/
 │    ├── pages/              # Next.js pages
 │    ├── layouts/
 │    ├── hooks/
 │    ├── services/           # API clients
 │    ├── store/              # Zustand/Redux
 │    ├── utils/
 │    ├── styles/
 │    ├── public/
 │    └── package.json
 │
 ├── agent/
 │    ├── core/
 │    ├── tracker/            # app/window/idle
 │    ├── recorder/           # screen recording chunks
 │    ├── network/            # LAN discovery + cloud fallback
 │    ├── uploader/           # HTTP + WS
 │    ├── config/
 │    └── main.py
 │
 ├── storage/
 │    └── recordings/
 │
 ├── scripts/
 ├── .env.example
 └── README.md

====================================================
🔐 ENV (.env.example)
====================================================

DATABASE_URL=postgresql://user:password@localhost:5432/workforce
REDIS_URL=redis://localhost:6379

SECRET_KEY=
JWT_SECRET=

API_BASE_URL=http://localhost:8000
WEBSOCKET_URL=ws://localhost:8000/ws

STORAGE_PATH=./storage/recordings

AGENT_API_KEY=

LAN_DISCOVERY_PORT=54545
LAN_BROADCAST_INTERVAL=5

RECORDING_CHUNK_SECONDS=30
MAX_RECORDING_DURATION=300

CODE_TTL_SECONDS=300

====================================================
🗃️ DATA MODEL (SQLAlchemy)
====================================================

TABLE users:
- id (uuid pk)
- role (admin | employee)
- name (nullable for employee)
- created_at

TABLE devices:
- id (uuid pk)
- user_id (fk users.id)
- hostname
- local_ip
- last_seen_at
- is_active (bool)
- created_at

TABLE auth_codes:
- id (uuid pk)
- code (string, 6-digit)
- created_by_admin_id (fk users.id)
- expires_at
- is_used (bool)

TABLE sessions:
- id (uuid pk)
- device_id (fk devices.id)
- started_at
- ended_at (nullable)
- is_active (bool)

TABLE activity_logs:
- id (uuid pk)
- device_id
- timestamp
- app_name
- window_title
- is_idle (bool)
- duration_seconds

TABLE recordings:
- id (uuid pk)
- device_id
- file_path
- duration_seconds
- created_at

INDEXES:
- activity_logs(device_id, timestamp)
- sessions(device_id, is_active)
- recordings(device_id, created_at)

====================================================
🔐 AUTH & DEVICE PAIRING
====================================================

ADMIN AUTH:
- Email/password JWT
- POST /auth/admin/login

AUTH CODE FLOW:
- Admin generates 6-digit code (TTL 5 min)
- POST /auth/generate-code
- Store in auth_codes

DEVICE LOGIN (FRONTEND + AGENT):
- App opens → ONLY show “Enter Authentication Code”
- POST /auth/verify-code
- If valid:
  → create user (employee if needed)
  → register device
  → create active session
  → return JWT (device-scoped)

CONSTRAINTS:
- code is single-use
- expires after TTL
- bind device_id to session

====================================================
🌐 NETWORK (LAN + CLOUD HYBRID)
====================================================

AGENT LOGIC:

1) Try LAN discovery:
   - UDP broadcast on LAN_DISCOVERY_PORT
   - Backend responds with IP + port
   - If found → use LAN endpoint

2) Else:
   - Use API_BASE_URL (cloud)

3) Maintain heartbeat:
   - every 5–10 sec
   - update devices.last_seen_at

4) Auto-switch if LAN becomes unavailable

====================================================
⚙️ MVP FEATURES (STRICT ORDER)
====================================================

STEP 1 — BACKEND BOOTSTRAP
- FastAPI app
- config loader
- DB engine + session
- base router
- health endpoint

STEP 2 — ADMIN AUTH + CODE SYSTEM
- models: users, auth_codes
- endpoints:
  POST /auth/admin/login
  POST /auth/generate-code
  POST /auth/verify-code
- hashing, JWT, validation

STEP 3 — DEVICE & SESSION MGMT
- models: devices, sessions
- endpoints:
  POST /devices/register (via verify-code)
  POST /sessions/start
  POST /sessions/stop
  GET  /devices
- ensure 1 active session per device

STEP 4 — ACTIVITY TRACKING
- endpoint: POST /activity/batch
- validate payload
- bulk insert logs
- compute idle vs active durations

STEP 5 — RECORDING SYSTEM (LOCAL ONLY)
- agent records chunks (30s)
- saves to STORAGE_PATH
- endpoint: POST /recordings/metadata
- store path + duration in DB
- DO NOT upload video files

STEP 6 — REALTIME (WS + REDIS)
- WebSocket endpoint /ws
- Redis pub/sub channels:
  - activity_updates
  - device_status
- broadcast:
  - device online/offline
  - latest activity

STEP 7 — FRONTEND (NEXT.JS)
- Global layout + auth guard
- Pages:

  1) /login
     - single input: auth code
     - call /auth/verify-code
     - store JWT

  2) /dashboard
     - cards:
       Active Devices
       Idle Devices
       Offline Devices
     - live grid:
       device cards (name, status, current app, session time)

  3) /devices
     - table:
       device, last_seen, status, session

  4) /device/[id]
     - details:
       timeline (activity)
       current app
       session info
       recordings list (video player)

  5) /reports (basic)
     - daily activity summary (real data)

- Use:
  - Tailwind
  - skeleton loaders
  - error + empty states
  - WS for live updates

STEP 8 — AGENT
- modules:
  - tracker:
      * active window (OS-specific)
      * app name
      * idle detection
  - recorder:
      * screen capture → mp4 chunks
      * compress (reasonable bitrate)
  - network:
      * LAN discovery + fallback
  - uploader:
      * send activity batch
      * send recording metadata
      * WS heartbeat

- config via env

====================================================
🧪 TESTING & VALIDATION (MANDATORY)
====================================================

FOR EACH STEP:
- Provide run commands
- Manual test steps
- Expected outputs

FINAL END-TO-END TEST:

1) Admin login → generate code
2) Open frontend → enter code → login success
3) Start agent → auto connect (LAN if available)
4) Activity appears in dashboard (realtime)
5) Recording files created locally
6) Metadata visible in UI
7) Device status updates live

NO PROGRESSION UNTIL ALL PASS.

====================================================
🔒 SECURITY & EDGE CASES
====================================================

- Code expiration + single use
- Rate limit /auth endpoints
- Validate payload sizes (activity batches)
- Handle:
  - duplicate device registration
  - network drops
  - clock skew for TTL
  - large recording counts (pagination)

====================================================
📈 PHASE 2 (AFTER MVP STABLE)
====================================================

- Recording playback optimization
- Alerts (idle threshold)
- Advanced reports
- Role-based access

====================================================
📌 DEVELOPMENT FLOW
====================================================

Follow EXACT order:

1) Backend bootstrap
2) Auth + codes
3) Devices + sessions
4) Activity API
5) Agent (tracker)
6) Recording
7) Realtime
8) Frontend
9) End-to-end testing

After each step:
- full code
- run instructions
- tests
- confirm working


note : "frontend on human readble data show and all data readable UI and text and message format also readable and UI also smooth"
====================================================
START NOW
====================================================

Step 1: Initialize backend with FastAPI, PostgreSQL connection, config loader, and base routing.

If anything is unclear → ASK USER before continuing.