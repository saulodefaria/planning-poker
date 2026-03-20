# Server Architecture

## Purpose

The server is the source of truth for room state. It owns business rules, persists rooms in Redis, exposes a small HTTP API, and broadcasts live updates over Socket.IO.

Today the backend is one deployable Node.js process that:

- loads configuration from `.env`
- connects to Redis
- serves REST endpoints under `/api`
- hosts the Socket.IO server
- serves the built frontend in production

## Folder layout

`src/config/`

- Environment loading and typed config.
- `loadConfig()` is the only place that should read `process.env`.

`src/domain/`

- Core room model, shared server-side types, error types, and business rules.
- Keep this layer framework-free.
- Domain helpers currently mutate the `Room` object they receive and return it for convenience.

`src/application/`

- Use-case orchestration.
- `RoomService` coordinates validation, domain operations, persistence, TTL refresh, and serialization.

`src/infrastructure/`

- Adapters for external systems.
- Right now this is Redis client setup plus the room repository implementation.

`src/routes/`

- HTTP transport only.
- Parse requests, call the service, map errors to HTTP responses.

`src/realtime/`

- Socket.IO transport only.
- Validate event payload shape, call the service, emit room state and errors.

`src/index.ts`

- Composition root.
- Wires config, Redis, repository, service, Express, and Socket.IO together.
- This is the only place that should know about all layers at once.

## Runtime flow

For a room action, the intended flow is:

1. Transport receives input.
2. Transport does minimal shape checks.
3. `RoomService` loads the room and orchestrates the use case.
4. Domain functions apply the business rule.
5. Repository persists the updated room JSON with a fresh TTL.
6. Service returns a serialized room.
7. Transport maps that result to HTTP JSON or `room:state`.

Keep the flow one-directional. If logic starts appearing in both `routes/` and `realtime/`, move it down into `application/` or `domain/`.

## Import boundaries

Use these rules to keep the layering clean.

`domain`

- Can import from other `domain` files.
- Must not import from `application`, `infrastructure`, `routes`, `realtime`, or Express/Socket.IO/Redis packages.

`application`

- Can import `domain/*`, `config/*`, and boundary contracts/types.
- Must not import Express, Socket.IO, Redis clients, or any concrete transport code.
- `RoomService` should depend on the repository interface, not on Redis behavior.

`infrastructure`

- Can import domain types needed for persistence shape.
- Must not contain business rules or HTTP/socket concerns.
- Keep it focused on serialization, storage, and external client setup.

`routes` and `realtime`

- Can import `application/*`, `domain/errors`, and small transport-neutral helpers.
- Must not mutate room entities directly.
- Must stay thin: validate payload shape, delegate, translate errors, emit responses.

`index.ts`

- May import everything because it is the composition root.
- Avoid spreading wiring logic into other files.

## State and contract rules

- Redis stores one JSON blob per room under `room:<id>`.
- Saving a room refreshes the TTL, so room expiry is sliding rather than fixed from creation time.
- Never send a raw `Room` object to clients. Always use `serializeRoom()` so hidden votes stay hidden during the voting phase.
- The frontend contract in `web/src/types.ts` mirrors the serialized room shape from `server/src/domain/types.ts`. When one changes, the other must change in the same feature.

## Coding conventions

- Keep domain code synchronous and deterministic where possible.
- Throw `AppError` for expected business failures. Let transports translate it into HTTP or socket errors.
- Keep transport-specific validation shallow. Deep business validation belongs in `domain` or `application`.
- Use relative ESM imports with `.js` extensions in server TypeScript files, matching the current build setup.
- Prefer adding a new method to `RoomService` over calling repositories directly from a route or socket handler.
- Keep repository methods generic and persistence-focused. Do not leak transport concepts into repository APIs.

## Writing a new backend feature

Use this sequence for most room-related changes:

1. Update `src/domain/types.ts` if the room shape or serialized contract changes.
2. Add or change the rule in `src/domain/room.ts` and raise `AppError` for invalid states.
3. Extend `RoomService` to orchestrate loading, mutation, saving, and serialization.
4. Expose the action through `routes/` or `realtime/` if clients need it.
5. Only touch `infrastructure/` if persistence shape or external integration changes.
6. Add tests at the layer where the rule lives, then add transport tests if the API/event surface changed.

## What to avoid

- Do not put business rules in Express routes or socket handlers.
- Do not read `process.env` outside `config/env.ts`.
- Do not return unserialized room data to the web client.
- Do not couple tests or production code to console output.
- Do not make `infrastructure/` the place where room behavior lives just because Redis is involved.
