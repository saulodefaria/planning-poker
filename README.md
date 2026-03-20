# Planning Poker

Real-time Planning Poker app for agile estimation. Built with React, Node.js, Socket.IO, and Redis.

## Prerequisites

- Node.js >= 20
- Docker (for Redis via docker-compose) or Redis running locally

## Setup

```bash
cp .env.example .env   # adjust ports if needed
npm install
```

## Start Redis

```bash
docker compose up -d
```

Redis is exposed on port `6379` by default (configurable via `REDIS_PORT` in `.env`).

## Development

Run in two terminals:

```bash
# Terminal 1 - Backend (reads PORT from .env, default 3000)
npm run dev:server

# Terminal 2 - Frontend (reads VITE_PORT from .env, default 5173)
npm run dev:web
```

Open [http://localhost:5173](http://localhost:5173) (or whatever `VITE_PORT` is set to)

## Production Build

```bash
npm run build
npm start
```

The server runs on the defined port (default 3000) and serves the frontend.

## Tests

```bash
npm test
```

## Docker

```bash
docker build -t planning-poker .
docker run -p 3000:3000 -e REDIS_URL=redis://host.docker.internal:6379 planning-poker
```

## Environment Variables

| Variable                    | Default                  | Description                      |
| --------------------------- | ------------------------ | -------------------------------- |
| `NODE_ENV`                  | `development`            | Environment                      |
| `PORT`                      | `3000`                   | Server port                      |
| `VITE_PORT`                 | `5173`                   | Vite dev server port             |
| `REDIS_PORT`                | `6379`                   | Redis host port (docker-compose) |
| `REDIS_URL`                 | `redis://localhost:6379` | Redis connection URL             |
| `ROOM_TTL_SECONDS`          | `86400`                  | Room expiry (24h)                |
| `MAX_PARTICIPANTS_PER_ROOM` | `30`                     | Max users per room               |

## Architecture

```
server/src/
  domain/       # Types, business rules, pure functions
  application/  # RoomService (orchestration)
  infrastructure/ # Redis client and repository
  realtime/     # Socket.IO event handlers
  routes/       # REST endpoints
  config/       # Environment config

web/src/
  components/   # React UI components
  hooks/        # useRoomSocket, useLocalRoomIdentity
  services/     # REST calls, local persistence, page-state helpers
  pages/        # HomePage, RoomPage
```

Single backend service serves the built frontend and hosts the Socket.IO server. Redis stores one JSON blob per room with a 24-hour sliding TTL.
