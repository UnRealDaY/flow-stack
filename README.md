# FlowStack

A production-grade SaaS platform built as a polyglot monorepo — each service uses the language that fits it best.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                      │
│              (auth, dashboard, billing, uploads)             │
└──────────┬──────────────┬──────────────────────┬────────────┘
           │ REST          │ WebSocket             │ REST
           ▼               ▼                       ▼
┌──────────────────┐ ┌──────────────┐ ┌───────────────────────┐
│  Core API        │ │  Realtime    │ │  Payment Service      │
│  Node.js/Express │ │  Node.js/WS  │ │  Laravel + Cashier    │
│  Prisma + PG     │ │  Redis pub/sub│ │  Stripe integration   │
└──────────┬───────┘ └──────┬───────┘ └───────────┬───────────┘
           │                │                       │
           │    ┌───────────┘                       │
           │    │  Redis (pub/sub + presence)        │
           │    └───────────────────────────────────┘
           │
           ▼
┌──────────────────┐     ┌─────────────────────┐
│  File Service    │────▶│  MinIO (S3-compat)  │
│  Python/FastAPI  │     │  Object Storage      │
│  Celery workers  │     └─────────────────────┘
└──────────────────┘
           │
           ▼
      PostgreSQL
```

## Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Core API      | Node.js · Express · Prisma · Zod    |
| Realtime      | Node.js · socket.io · Redis         |
| File Service  | Python · FastAPI · Celery · Pillow  |
| Payment       | Laravel · Cashier · Stripe          |
| Frontend      | Next.js · Material UI · React Query |
| DB            | PostgreSQL 16                       |
| Cache / Queue | Redis 7                             |
| Storage       | MinIO (S3-compatible)               |

## Quick start

```bash
# 1. Clone and enter the repo
git clone <repo-url> && cd flow-stack

# 2. Create your .env
make env

# 3. Start infrastructure
make up

# 4. Verify containers are healthy
make ps
```

## Services

| Service                        | Port  | Docs                             |
|--------------------------------|-------|----------------------------------|
| Core API                       | 4000  | [apps/core-api](apps/core-api/)  |
| Realtime                       | 4001  | [apps/realtime](apps/realtime/)  |
| File Service                   | 8000  | [apps/file-service](apps/file-service/) |
| Payment                        | 8001  | [apps/payment](apps/payment/)    |
| Frontend                       | 3000  | [apps/frontend](apps/frontend/)  |
| MinIO Console                  | 9001  | http://localhost:9001            |

## Repo layout

```
flow-stack/
├── apps/
│   ├── core-api/       Node.js — auth, workspaces, users
│   ├── realtime/       Node.js — WebSocket, presence, events
│   ├── file-service/   Python  — upload, processing, Celery
│   ├── payment/        Laravel — subscriptions, Stripe
│   └── frontend/       Next.js — UI
├── packages/           Shared types, utils (future)
├── infra/              Terraform / Railway configs (future)
├── docs/               ADRs, API specs
├── docker-compose.yml
├── .env.example
└── Makefile
```

## Demo

> Live demo: _coming soon_
> Login: `demo@flowstack.dev` / `demo1234`
