# CanvasFlow

CanvasFlow is a realtime collaborative whiteboard built as a portfolio project to demonstrate modern frontend engineering, event-driven backend design, and scalable collaboration infrastructure.

## Stack

- `apps/web`: Next.js App Router, TypeScript, Tailwind CSS v4, Zustand, React Konva, Socket.IO client
- `apps/api`: Express, TypeScript, Prisma, PostgreSQL, Redis Pub/Sub, Socket.IO
- `packages/shared`: shared contracts, board schemas, auth types, and socket payload definitions
- Infrastructure: Docker Compose, GitHub Actions CI, environment-driven configuration

## Features

- Realtime room-based collaboration with live cursor presence
- Drawing tools: pencil, rectangle, ellipse, text, eraser
- Object selection, movement, zoom, pan, and local undo/redo
- JWT auth with guest collaboration mode
- Persistent boards and autosaved snapshots in PostgreSQL
- Redis-backed socket fan-out for multi-instance broadcasting
- Landing page, dashboard, seeded demo room, and dark/light mode support

## Project Structure

```text
apps/
  api/      Express + Socket.IO + Prisma backend
  web/      Next.js whiteboard frontend
packages/
  shared/   Shared domain types and zod schemas
```

## Local Development

1. Copy `.env.example` to `.env`.
2. Install dependencies:

```bash
npx pnpm@10.16.1 install
```

3. Start infrastructure:

```bash
docker compose up -d postgres redis
```

4. Generate Prisma client and run migrations:

```bash
npx pnpm@10.16.1 --filter @canvasflow/api prisma:generate
npx pnpm@10.16.1 --filter @canvasflow/api prisma:migrate
```

5. Seed the demo account and demo board:

```bash
npx pnpm@10.16.1 --filter @canvasflow/api prisma:seed
```

6. Start both apps:

```bash
npx pnpm@10.16.1 dev
```

The Docker frontend runs on `http://localhost:3001`, the local Next.js dev server runs on `http://localhost:3000` when that port is free, and the API/socket server runs on `http://localhost:4000`.

## Docker Compose

Bring up the full stack:

```bash
docker compose up --build
```

This starts:

- `web` on port `3001`
- `api` on port `4000`
- `postgres` on port `55432`
- `redis` on port `6379`

## Demo Credentials

- Email: `demo@canvasflow.dev`
- Password: `Password123!`
- Demo room: `demo-room`

## Scripts

```bash
npx pnpm@10.16.1 typecheck
npx pnpm@10.16.1 test
npx pnpm@10.16.1 build
```

## Architecture Notes

- Board state is shared through `packages/shared` so the REST API, WebSocket layer, and frontend stay contract-aligned.
- The backend uses debounced snapshot persistence to avoid hammering PostgreSQL during rapid drawing bursts.
- Socket.IO + Redis Pub/Sub provide low-friction room management and horizontal fan-out without coupling the frontend to a custom protocol.
- The frontend keeps optimistic local board updates in Zustand and reconciles committed scenes from the server.

## CI

GitHub Actions runs install, Prisma generation, typecheck, tests, and production builds for the workspace.
