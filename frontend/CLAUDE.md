@AGENTS.md

# CLAUDE.md
## AI Workforce Monitoring – Development Protocol

This file defines how AI (Claude/ChatGPT) must build and maintain the system.

--------------------------------------------------

## 🎯 OBJECTIVE

Build a production-ready SaaS system with:

- Real-time workforce monitoring
- Activity tracking
- Local screen recording
- Code-based login
- LAN + Cloud hybrid connectivity

--------------------------------------------------

## 🚨 CORE RULES

1. ALWAYS build MVP first
2. NO mock or static data
3. Every module must be connected end-to-end
4. Test after every step
5. Fix before moving forward
6. If unclear → ASK before proceeding

--------------------------------------------------

## 🧱 SYSTEM ARCHITECTURE

Agent → Backend → PostgreSQL
       → Redis (realtime)
       → WebSocket → Frontend

Storage:
Local only (recordings)

--------------------------------------------------

## 📦 MODULE PRIORITY ORDER

STRICT ORDER:

1. Backend setup
2. Authentication system
3. Code login flow
4. Device + session system
5. Activity tracking API
6. Agent tracker
7. Recording system
8. WebSocket + Redis
9. Frontend dashboard
10. LAN discovery
11. End-to-end testing

--------------------------------------------------

## 🔐 AUTH FLOW

Admin:
- Login via email/password
- Generate 6-digit code

Employee:
- Enter code
- System verifies
- Device registered
- Session created

--------------------------------------------------

## 📊 DATA FLOW

Agent → API → DB → Redis → WebSocket → UI

No stage can be skipped.

--------------------------------------------------

## ⚙️ BACKEND REQUIREMENTS

- FastAPI
- SQLAlchemy
- Pydantic validation
- JWT auth
- Clean modular architecture

--------------------------------------------------

## 🎨 FRONTEND REQUIREMENTS

- Next.js
- Tailwind CSS
- Realtime updates
- Pages:

/login
/dashboard
/devices
/device/[id]
/reports

--------------------------------------------------

## 🌐 NETWORK LOGIC

Agent must:

IF LAN available:
  → connect via local IP

ELSE:
  → use cloud API

Auto-switch required.

--------------------------------------------------

## 🧪 TESTING RULES

After each module:

- Verify API works
- Check DB entries
- Confirm UI updates
- Ensure no crashes

Final test:

- Login → Agent → Activity → Recording → Realtime → Dashboard

--------------------------------------------------

## ⚠️ COMMON FAILURES (AVOID)

- Building UI without backend
- Using dummy data
- Skipping agent implementation
- No realtime system
- No validation

--------------------------------------------------

## ✅ DEFINITION OF DONE

System is complete ONLY when:

- Agent generates real data
- Backend stores correctly
- Frontend shows live updates
- Recording works locally
- LAN + Cloud switching works

--------------------------------------------------

## 🚀 DEVELOPMENT STYLE

- Build small modules
- Test immediately
- Keep code clean
- Avoid overengineering
- Focus on working system first

--------------------------------------------------

## 📌 FINAL RULE

DO NOT proceed to next feature if current one is broken.