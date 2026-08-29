# ReachInbox Frontend — Backend Integration Notes

Generated: 2026-08-28  
Status: Frontend complete. Issues below require backend follow-up before full integration.

---

## 🔴 CRITICAL — Missing Backend Endpoints

### 1. Google OAuth — No Auth Endpoint Exists

**Impact**: Frontend cannot authenticate against the backend.

**What the backend has**: The `passport-google-oauth20` package is installed as a dependency in `backend/package.json`, but there are **zero route files or Passport strategy configurations** for it. The `server.ts` only mounts `/api/emails/*` routes. There is no `/auth/google`, `/auth/callback`, `/auth/me`, `/auth/logout`, or session middleware of any kind.

**Current frontend workaround**: The frontend implements **client-only Google OAuth** using `@react-oauth/google`. The Google ID token (JWT) is decoded client-side, and the user's profile (name, email, picture) is stored in `localStorage`. No backend session/cookie is created.

**What the backend needs to add** (to convert to server-side auth):
```
POST /auth/google           — accepts { credential: string }, verifies with Google, creates session
GET  /auth/me               — returns current user from session
POST /auth/logout           — destroys session
```

**To fix in frontend**: Update `AuthContext.tsx` to call `POST /auth/google` instead of decoding locally, and remove the `localStorage`-based auth.

---

### 2. Slack OAuth — Not Implemented in Backend

**Impact**: "Connect Slack" button is disabled in the frontend.

**What the backend has**: 
- A `SlackConnection` Prisma model exists (with `teamId`, `accessToken`, `channelId`)
- `slack.ts` is a **stub** — it only does a `console.log()` and does not call the Slack API

**What is missing**:
- No Slack app credentials in `.env` (`SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_REDIRECT_URI`)
- No `/auth/slack` redirect endpoint
- No `/auth/slack/callback` OAuth callback
- No endpoint to check connection status (`GET /api/slack/status`)
- No endpoint to disconnect (`DELETE /api/slack`)

**Current frontend behavior**: The "Connect Slack" button is rendered as `disabled` with a tooltip explaining the missing endpoint. The constant `SLACK_CONNECTED = false` in `Header.tsx` must be replaced with a real API call once the endpoint exists.

**What the backend needs to add**:
```
GET  /auth/slack                  — initiates OAuth redirect to Slack
GET  /auth/slack/callback         — handles OAuth callback, stores SlackConnection
GET  /api/slack/status            — returns { connected: boolean, teamId?, channelId? }
DELETE /api/slack                 — disconnects Slack
```

---

### 3. GET /api/senders — Missing Sender List Endpoint

**Impact**: Compose modal cannot populate a sender dropdown; user must manually enter a Sender UUID.

**What the backend has**: A `Sender` model in Prisma with `id`, `name`, `email`, `maxEmailsPerHour`. The `POST /api/emails/schedule` **requires** a `senderId` UUID to be provided.

**What is missing**: No `GET /api/senders` endpoint to list available senders.

**Current frontend behavior**: The compose form makes a request to `GET /api/senders`. If it fails (404), it shows a warning banner explaining the situation and lets the user enter a UUID manually as a fallback.

**What the backend needs to add**:
```
GET  /api/senders              — returns { senders: Sender[] }
POST /api/senders              — create a sender (optional, could be seeded)
GET  /api/senders/:id          — get single sender
```

---

## 🟡 WARNING — Partial Implementations

### 4. Slack Notifications Are Stubs

`backend/src/services/slack.ts` exports `notifyRateLimitHit()` which only does a `console.log()`. No actual Slack API calls are made even if a `SlackConnection` row existed. This is an internal backend concern but means Slack notifications won't fire until fully implemented.

### 5. No Hourly Limit or Delay Per Scheduling Request

The `POST /api/emails/schedule` accepts `{ to, subject, body, senderId, scheduledAt }`. There is **no per-request delay or hourly-limit field** — rate limiting is enforced server-side per sender's `maxEmailsPerHour`.

The frontend handles the "delay between emails" UX by computing `scheduledAt = startTime + (index * delaySeconds * 1000)` for each recipient and calling the API once per recipient. This is correct given the current backend design.

---

## ✅ Confirmed Working

| Feature | Status | Notes |
|---------|--------|-------|
| `POST /api/emails/schedule` | ✅ Ready | Validated with Zod |
| `GET /api/emails/scheduled` | ✅ Ready | Returns SCHEDULED, QUEUED, RATE_LIMITED |
| `GET /api/emails/sent` | ✅ Ready | Returns SENT, FAILED |
| `GET /api/emails/search?q=` | ✅ Ready | Elasticsearch multi_match on to/subject/body |
| CORS | ✅ Ready | `cors()` with no origin restrictions |
| Port | ✅ 4000 | `VITE_API_BASE_URL=http://localhost:4000` in frontend `.env` |

---

## Environment Variables Required

### Frontend (`frontend/.env`)
```
VITE_API_BASE_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
```

### Backend (already set in `backend/.env`)
```
DATABASE_URL=postgresql://reachinbox:reachinbox@localhost:5432/reachinbox?schema=public
REDIS_URL=redis://localhost:6379
PORT=4000
ETHEREAL_USER=...
ETHEREAL_PASS=...
```

### Backend (to add for Slack — not yet needed)
```
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:4000/auth/slack/callback
SLACK_SIGNING_SECRET=
```

---

## How to Run (Development)

1. Start infrastructure: `docker-compose up -d` (Postgres, Redis, Elasticsearch)
2. Run backend migrations: `cd backend && npx prisma migrate dev`
3. Start backend server: `cd backend && npm run dev`
4. Start backend worker: `cd backend && npm run worker` (in a separate terminal)
5. Start frontend: `cd frontend && npm run dev`
6. Open: `http://localhost:5173`

> **Important**: Set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` before running. 
> Get a Google OAuth client ID from [Google Cloud Console](https://console.cloud.google.com/). 
> Add `http://localhost:5173` to the list of authorized JavaScript origins.
