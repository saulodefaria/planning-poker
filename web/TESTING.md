# Web Testing

## Current state

The frontend currently has no automated test runner, no test script, and no committed frontend test files.

That is acceptable for now, but it changes the contributor expectation:

- every UI or room-flow change needs manual verification
- feature work should keep logic easy to test later
- regressions are most likely in socket flow, reconnect behavior, and UI state derived from room state

## Current quality bar

Until a frontend test suite exists, a change is not complete without manually walking the affected flow in the browser.

Use this as the default manual QA checklist after frontend changes:

1. Create a room from the home page.
2. Join the room and confirm the saved name/reconnect behavior still works.
3. Open a second tab or browser window and verify live participant updates.
4. Cast votes, reveal, and restart a round.
5. If tickets were touched, add, select, clear, remove, and review voted ticket history.
6. Refresh the page and confirm identity restoration still behaves correctly.
7. If routing or loading changed, verify the room-not-found path and the loading/connecting states.

## Best practices while we have no test suite

- Keep transport logic inside hooks so it can be tested later without mounting the whole page.
- Keep browser storage logic inside `useLocalRoomIdentity()`.
- Keep components mostly prop-driven so manual regressions are easier to localize and future tests are easier to write.
- Extract pure helper functions when logic starts getting dense.
- Prefer server-driven truth over fragile client-side reconstruction.

## If we add frontend tests later

Recommended direction:

- Use Vitest so the frontend matches the server's test runner.
- Add React Testing Library for component and page behavior.
- Prefer `*.test.tsx` or `*.test.ts` files close to the feature they cover.

Testing priorities should be:

- hooks with socket or storage behavior
- route-level behavior in `RoomPage`
- critical interaction components with meaningful state transitions

Low-value targets:

- snapshot-heavy tests
- tests that assert Tailwind class names instead of user-visible behavior
- tests that duplicate React Router or Socket.IO internals

## Dos

- Do manually test in at least two tabs for real-time room changes.
- Do verify both happy paths and failure states.
- Do check reconnect and refresh behavior whenever room identity logic changes.
- Do test the full reveal flow whenever vote or countdown code changes.
- Do prefer behavior assertions over markup snapshots if automated tests are introduced.

## Don'ts

- Do not add dense logic into a presentational component if it really belongs in a hook or page.
- Do not rely on manual memory of the flow; follow a checklist.
- Do not test styling details before testing whether the user can complete the flow.
- Do not create frontend-only state that can get out of sync with `room:state`.

## Suggested first automated tests

If the team decides to add frontend tests, start with the highest-risk flows:

1. `useLocalRoomIdentity()` reading and writing persisted identity
2. `useRoomSocket()` mapping socket events into hook state
3. `RoomPage` join and reconnect behavior
4. reveal/restart UI transitions
5. ticket selection and history rendering

Those will give better regression protection than shallow component snapshots.
