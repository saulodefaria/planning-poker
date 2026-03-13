# Web Architecture

## Purpose

The web app is a Vite + React client for creating rooms, joining them, and reacting to live room state pushed by the server.

It intentionally stays simple:

- route-level pages orchestrate behavior
- hooks encapsulate browser and socket integrations
- components render the UI from typed props

There is no global state library. The room page is the feature shell, and Socket.IO is the live source of truth once a user is connected.

## Folder layout

`src/pages/`
- Route-level containers.
- Own page composition, navigation, initial fetches, reconnect flow, and UI-only derived state.

`src/hooks/`
- Integrations with outside systems such as Socket.IO and `localStorage`.
- Expose typed APIs that pages can compose.
- Should not render JSX.

`src/components/`
- Reusable UI building blocks.
- Prefer prop-driven rendering and callbacks upward.
- Small local UI state is fine when it is truly presentation-specific.

`src/types.ts`
- Frontend contract for room data and UI-facing shared types.
- This mirrors the serialized room shape coming from the server.

`src/index.css`
- Global theme tokens and cross-app animations.
- Keep shared visual primitives here instead of scattering one-off global CSS.

`src/App.tsx` and `src/main.tsx`
- Bootstrapping and routing only.

## Data flow

The normal flow through the web app is:

1. `HomePage` creates a room with `POST /api/rooms`.
2. `RoomPage` fetches the initial room snapshot with `GET /api/rooms/:roomId`.
3. `useRoomSocket()` opens the Socket.IO connection.
4. `RoomPage` handles join/reconnect and keeps local-only UI state such as countdown visibility and selected vote.
5. Components render from props and call callbacks upward.
6. Server emits `room:state`, and that state becomes the live room view.

Once connected, avoid inventing another client-side source of truth for room contents. Room membership, reveal state, tickets, and stats should come from the server payload.

## Import boundaries

Use these boundaries to keep the app maintainable.

`components`
- Can import `src/types.ts` and other leaf components when composing UI.
- Should not import `pages`.
- Should not own fetch calls, socket setup, or routing decisions.
- Browser-only leaf behavior is okay when it is self-contained, such as clipboard copy or local expand/collapse state.

`hooks`
- Can import `src/types.ts` and external libraries.
- Should not import `pages` or UI components.
- Own side effects for sockets, browser storage, and similar integrations.

`pages`
- Can import hooks, components, router APIs, and shared types.
- Own orchestration: fetch, navigation, reconnect, local UI state, and mapping server state into component props.

`types.ts`
- Keep this as the shared contract module for the frontend.
- If the serialized room shape changes on the server, update this file in the same feature.

## Current project conventions

- Use typed props and explicit interfaces.
- Keep server interaction near boundaries:
  - HTTP fetches in pages
  - Socket emit/listen logic in hooks
  - `localStorage` access in the identity hook
- Keep components focused on rendering and small local interaction details.
- Prefer deriving display text in the page layer rather than spreading formatting logic across multiple components.
- Prefer Tailwind utility classes plus shared theme tokens like `bg-surface` and `border-border`.
- Reserve `index.css` for global theme values and cross-cutting animations such as the reveal countdown.

## Shared contract rule

`web/src/types.ts` mirrors the server's serialized room model, not the raw domain entity.

That means:

- if the server adds a field to `SerializedRoom`, add it here
- if the server changes a field name or shape, update this file in the same commit
- do not add frontend-only guesses for server state when the backend should own the truth

## Writing a new frontend feature

For most room features, use this order:

1. Update `src/types.ts` if the server contract changed.
2. Extend `src/hooks/` if the transport layer changed.
3. Keep orchestration in the page that owns the route.
4. Push display-only UI into focused components.
5. Keep local state only for UI concerns such as form input, toggles, countdowns, and optimistic highlights.
6. Manually verify the full room flow, since there is no automated frontend suite yet.

## What to avoid

- Do not make presentational components fetch data directly.
- Do not access `localStorage` from arbitrary components; use the identity hook.
- Do not duplicate room state across multiple hooks or components when the socket payload already provides it.
- Do not let styling tokens drift into many raw hex values when a shared token already exists.
- Do not introduce a global state library unless the current page-plus-hook structure becomes insufficient.
