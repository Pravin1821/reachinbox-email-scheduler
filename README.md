# ReachInbox Email Scheduler

A full-stack email scheduling system with smart rate limiting, bulk CSV import, Elasticsearch search, Slack notifications, and Google OAuth — built as a technical challenge.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Express + TypeScript, Prisma ORM, PostgreSQL |
| **Queue** | BullMQ (delayed jobs), Redis (AOF persistence) |
| **Email** | Nodemailer + Ethereal SMTP (test mailbox) |
| **Search** | Elasticsearch 8.x (full-text across to/subject/body) |
| **Auth** | Passport.js + Google OAuth 2.0, express-session + Redis |
| **Notifications** | Slack Web API (`chat.postMessage`) |
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS |
| **Dev tooling** | Docker Compose (Postgres + Redis + Elasticsearch) |

---

## Prerequisites

- **Node 20 LTS** — required (Prisma 5.x has compatibility issues with Node 22+/24)
- Docker Desktop (for Postgres, Redis, Elasticsearch)
- A Google Cloud OAuth 2.0 client (see [setup](#google-oauth-setup))
- A Slack app with OAuth scopes (see [setup](#slack-oauth-setup))

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/yourname/reachinbox-email-scheduler.git
cd reachinbox-email-scheduler
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts three containers:

| Container | Service | Port |
|---|---|---|
| `reachinbox-postgres` | PostgreSQL 16 | 5432 |
| `reachinbox-redis` | Redis 7 | 6379 |
| `reachinbox-es` | Elasticsearch 8.14 | 9200 |

### 3. Configure environment variables

**Backend** — create/edit `backend/.env`:

```env
DATABASE_URL="postgresql://reachinbox:reachinbox@localhost:5432/reachinbox?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=4000

# Ethereal test SMTP — get free credentials at https://ethereal.email/create
ETHEREAL_USER="your-ethereal-user@ethereal.email"
ETHEREAL_PASS="your-ethereal-pass"

# Google OAuth — see setup section below
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/api/auth/google/callback"

# Session
SESSION_SECRET="generate-a-long-random-string-here"

# Frontend URL (for CORS + post-OAuth redirects)
FRONTEND_URL="http://localhost:5173"

# Slack OAuth — see setup section below
SLACK_CLIENT_ID="your-slack-client-id"
SLACK_CLIENT_SECRET="your-slack-client-secret"
SLACK_REDIRECT_URI="http://localhost:4000/api/slack/callback"
SLACK_DEFAULT_CHANNEL_ID="C0XXXXXXXXX"  # Slack channel ID to send notifications to
```

**Frontend** — create/edit `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

### 4. Run database migrations

```bash
cd backend
npx prisma migrate dev
```

### 5. Start the three processes

Open **three separate terminals**:

```bash
# Terminal 1 — Backend API server (port 4000)
cd backend
npm run dev

# Terminal 2 — BullMQ email worker
cd backend
npm run worker

# Terminal 3 — Frontend dev server (port 5173)
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (type: Web application)
3. Add **Authorized redirect URIs**:
   - `http://localhost:4000/api/auth/google/callback`
4. Add **Authorized JavaScript origins**:
   - `http://localhost:5173`
5. Copy the Client ID and Client Secret into `backend/.env`

> ⚠️ The redirect URI must point to the **backend** (`4000`), not the frontend. The frontend never handles the OAuth callback.

---

## Slack OAuth Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → Create New App → From scratch
2. Under **OAuth & Permissions**, add Bot Token Scopes:
   - `chat:write`
   - `channels:read`
3. Add **Redirect URL**: `http://localhost:4000/api/slack/callback`
4. Under **Basic Information**, copy Client ID and Client Secret into `backend/.env`
5. Set `SLACK_DEFAULT_CHANNEL_ID` to the channel ID where rate-limit notifications should be sent (right-click the channel in Slack → Copy link, the ID is at the end)
6. Install the app to your workspace and invite the bot to the target channel (`/invite @your-bot-name`)

---

## Architecture Overview

### Email Scheduling Pipeline

```
POST /api/emails/schedule
        │
        ▼
  Prisma: Email.create(status=SCHEDULED)
        │
        ▼
  Elasticsearch: index email
        │
        ▼
  BullMQ: emailQueue.add(emailId, { delay: scheduledAt - now })
          ← jobId = email.id (idempotent — guarantees no duplicate jobs)
        │
  [delay elapses]
        │
        ▼
  Worker picks up job
        │
        ├─ Rate limit check (Redis INCR per sender-hour, atomic)
        │       │
        │       ├─ ALLOWED → mark SENT, send via Ethereal SMTP
        │       │
        │       └─ DENIED  → rollback INCR, mark RATE_LIMITED,
        │                    requeue with delay to next hour window,
        │                    POST Slack notification
        │
        └─ Elasticsearch: update index
```

### Restart Persistence & Reconciliation

PostgreSQL is the **source of truth**. Redis/BullMQ is derived state.

On every server boot, `reconcileOnBoot()` runs before the first request is served:

1. Finds all emails with `status IN (SCHEDULED, RATE_LIMITED)`
2. For each, calls `emailQueue.getJob(emailId)` — if job is missing from Redis (e.g., after `FLUSHALL`), it re-enqueues with the correct delay
3. Resets any `PROCESSING` rows (server crash mid-send) back to `SCHEDULED`

This means a full Redis wipe is safe — emails are never permanently lost.

### Rate Limiting (Redis Atomic INCR)

```
key:  rate:{senderId}:{YYYY-MM-DDTHH}    (e.g., rate:abc123:2024-01-15T14)
TTL:  2 hours (sliding window cleanup)

Algorithm:
  INCR key
  if count > maxEmailsPerHour:
    DECR key (rollback)
    → RATE_LIMITED: requeue to next hour start
  else:
    → proceed to send
```

All counters are per-sender, per-hour. The key is auto-expired after 2 hours.

### Session Authentication

- Google OAuth 2.0 via Passport.js on the backend
- Session stored in Redis via `connect-redis` (`express-session`)
- Frontend uses `credentials: 'include'` on every API call to send the HTTP-only session cookie cross-port (5173 → 4000)
- No JWT, no localStorage — session is server-side only

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| GET | `/api/auth/google` | No | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | No | OAuth callback |
| GET | `/api/auth/me` | No | Get current session user |
| POST | `/api/auth/logout` | No | Destroy session |
| GET | `/api/senders` | ✅ | List all senders |
| POST | `/api/senders` | ✅ | Create a sender |
| POST | `/api/emails/schedule` | ✅ | Schedule an email |
| GET | `/api/emails/scheduled` | ✅ | List SCHEDULED/QUEUED/RATE_LIMITED emails |
| GET | `/api/emails/sent` | ✅ | List SENT/FAILED emails |
| GET | `/api/emails/search?q=` | ✅ | Elasticsearch full-text search |
| GET | `/api/slack/connect` | ✅ | Initiate Slack OAuth |
| GET | `/api/slack/callback` | No | Slack OAuth callback |
| GET | `/api/slack/status` | ✅ | Check if Slack is connected |
| DELETE | `/api/slack` | ✅ | Disconnect Slack |
| GET | `/admin/queues` | No | Bull Board dashboard |

---

## Features Checklist

### Backend

- [x] **Email Scheduler** — POST /api/emails/schedule creates a BullMQ delayed job; jobId = email UUID (idempotent)
- [x] **PostgreSQL Persistence** — Prisma ORM, Sender/Email/RateLimitWindow/SlackConnection models, migrations
- [x] **Rate Limiting** — Redis atomic INCR per sender-hour; automatically requeues breaching emails to next hour window
- [x] **Concurrency Safety** — BullMQ worker with concurrency=5; Redis INCR is atomic (no race condition under concurrent workers)
- [x] **Restart Safety** — Boot-time reconciler re-enqueues orphaned jobs after Redis wipe
- [x] **Slack Notifications** — Real `chat.postMessage` API call when rate limit is hit
- [x] **Google OAuth** — Passport.js server-side flow, session stored in Redis
- [x] **Elasticsearch** — Index on schedule + update on send; full-text search across to/subject/body
- [x] **Bull Board** — Queue monitoring dashboard at `/admin/queues`

### Frontend

- [x] **Google Sign-In** — Full-page redirect to backend OAuth (no client-side token)
- [x] **Session-based Auth** — Checks `/api/auth/me` on load; shows loading spinner; redirects on 401
- [x] **Dashboard** — Scheduled and Sent email tabs with live data
- [x] **Compose Modal** — Subject, body, recipient paste/CSV upload, start time, per-email delay, sender dropdown
- [x] **Sender Management** — Inline "Create Sender" form when no senders exist
- [x] **Bulk CSV Import** — Parse and schedule one job per recipient with configurable delay
- [x] **Search** — Elasticsearch-backed debounced search within each tab
- [x] **Loading / Empty States** — Spinner during fetch, descriptive empty state messages
- [x] **Slack Connect** — "Connect Slack" button redirects to OAuth; live connected/disconnected status; disconnect button

---

## Assumptions, Shortcuts, and Trade-offs

### PostgreSQL over MySQL
PostgreSQL was chosen for its native UUID support (`@default(uuid())`), superior indexing (composite indexes on `senderId + status`, `scheduledAt`), and better Prisma support. MySQL would require `uuid()` workarounds.

### Slack connection is global, not per-tenant
The `SlackConnection` model stores one workspace-wide connection. There's no multi-tenant user model (no `Users` table — authentication is stateless via Google session). A production system would store a SlackConnection per authenticated user or organisation.

### Session-only auth, no persisted Users table
After Google OAuth, the user's name/email/avatar is serialized directly into the Redis session. There's no Users database table. This means user data is lost if the session expires. A production system would upsert a Users row on each login.

### Ethereal SMTP (not real email delivery)
Emails are sent to [Ethereal](https://ethereal.email) — a fake SMTP server that captures messages for inspection. The preview URL is logged by the worker. To send real emails, replace `mailer.ts` with your SMTP provider (SendGrid, SES, etc.).

### No multi-worker horizontal scaling
The rate limiter uses Redis INCR (atomic) so it is safe under concurrent workers on the same machine. However, the `SLACK_DEFAULT_CHANNEL_ID` is a single env var — a multi-tenant deployment would need per-sender Slack channels.

### Node 20 LTS required
Prisma 5.x uses `@prisma/client` that is not compatible with Node 22+/24 due to native addon ABI changes. Pin to Node 20 LTS.

### Bull Board has no auth
The `/admin/queues` dashboard is exposed without authentication — suitable for local development only. Add middleware to protect it in any deployed environment.

---

## Project Structure

```
reachinbox-email-scheduler/
├── docker-compose.yml          # Postgres + Redis + Elasticsearch
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Sender, Email, RateLimitWindow, SlackConnection
│   └── src/
│       ├── config/             # env, redis, sessionRedis, passport, prisma
│       ├── controllers/        # emailController, senderController
│       ├── middleware/         # auth (requireAuth), errorHandler
│       ├── queues/             # emailQueue.ts (BullMQ)
│       ├── routes/             # authRoutes, emailRoutes, senderRoutes, slackRoutes
│       ├── services/
│       │   ├── mailer.ts       # Ethereal SMTP
│       │   ├── rateLimiter.ts  # Redis atomic INCR
│       │   ├── reconciler.ts   # Boot-time orphan recovery
│       │   ├── search.ts       # Elasticsearch index + search
│       │   ├── slack.ts        # Slack chat.postMessage
│       │   └── slackAuth.ts    # Slack OAuth token exchange
│       ├── workers/
│       │   └── emailWorker.ts  # BullMQ worker (send + rate limit)
│       └── server.ts
└── frontend/
    └── src/
        ├── api/                # client.ts, emails.ts, senders.ts, slack.ts
        ├── context/            # AuthContext.tsx (server-session)
        ├── features/
        │   ├── auth/           # LoginPage.tsx
        │   ├── compose/        # ComposeModal.tsx
        │   ├── dashboard/      # DashboardPage.tsx, Header.tsx
        │   ├── scheduled-emails/
        │   └── sent-emails/
        └── types/              # TypeScript interfaces
```
