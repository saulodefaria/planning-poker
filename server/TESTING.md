# Server Testing

## Current setup

- Test runner: Vitest
- Environment: Node
- Command: `npm test -w server`
- Watch mode: `npm run test:watch -w server`
- Current locations:
  - `src/domain/__tests__/`
  - `src/application/__tests__/`
  - `src/realtime/__tests__/`

The existing suite already follows a good pattern: test business rules close to the layer that owns them, and use lightweight in-memory doubles instead of real Redis.

## Testing strategy by layer

`domain` tests
- Cover validation, state transitions, derived values, and business errors.
- Prefer small fixtures and direct calls to domain functions.
- These tests should be fast and should not touch I/O.

`application` tests
- Treat `RoomService` as the unit under test.
- Use an in-memory `RoomRepository` fake.
- Assert orchestration behavior: create/load/save, name deduplication, capacity checks, serialization, and room flow.

`realtime` tests
- Use a real Socket.IO server plus test clients.
- Keep persistence fake and in-memory.
- Assert acknowledgements, broadcasts, and error events from the outside in.

`infrastructure` tests
- Usually not needed for every change because the Redis adapter is intentionally thin.
- Add focused tests only if repository serialization or Redis-specific behavior becomes non-trivial.

## Best practices

- Prefer in-memory repository fakes over real Redis.
- Clone stored values inside fakes with `structuredClone()` so tests do not accidentally pass because of shared object references.
- Assert observable behavior, not implementation details.
- Test both happy paths and rule violations.
- Name tests after behavior, not method internals.
- Keep fixtures readable and small. Build them from public helpers where possible.
- When IDs are generated internally, assert presence and effect rather than exact UUID values.
- When a feature changes the room contract, add at least one assertion against the serialized room shape returned to callers.

## Dos

- Do add domain tests for new room rules first.
- Do add service tests when orchestration, persistence, or serialization behavior changes.
- Do add socket tests when event names, acknowledgements, broadcasts, or error propagation change.
- Do cover invalid states with `AppError` expectations.
- Do keep tests independent; each test should set up its own room state.

## Don'ts

- Do not hit real Redis in unit tests.
- Do not assert on `console.log()` or `console.warn()` output.
- Do not call private methods directly.
- Do not duplicate every domain assertion again at the service layer unless the service adds extra behavior.
- Do not make socket tests depend on timing more than necessary; wait for emitted states instead of sleeping.

## When adding a new feature

A good default is:

1. Add or update domain tests for the rule itself.
2. Add service tests for orchestration and returned room state.
3. Add socket tests if clients trigger the feature live.
4. Add route tests only if the REST surface gains important branching or validation that is not already covered elsewhere.

If you changed only the transport mapping and not the room rule, keep the new tests in the transport layer and avoid re-testing the entire domain flow.

## Useful test patterns from this codebase

- Repository fake backed by `Map<string, Room>`
- `structuredClone()` on read and write
- Creating a real ephemeral HTTP server for socket tests
- Waiting on Socket.IO acknowledgements and `room:state` emissions instead of using arbitrary delays

## Coverage guidance

Prioritize these regressions:

- hidden votes becoming visible before reveal
- invalid state transitions
- participant identity and reconnect flow
- ticket lifecycle and current ticket selection
- room serialization contract drifting away from the frontend expectation
