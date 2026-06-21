# Quality Gates

These gates must pass before a roadmap step is considered complete.

## Common Gates

- `npm run lint` passes.
- `npm run build` passes.
- `npm run test` passes when tests exist or when puzzle logic changes.
- TypeScript strictness is preserved.
- No `any` is introduced without a strong reason.
- No official game name, official image, official board design, official robot/token design, or copied rulebook text is added.
- No functionality outside the selected roadmap step is implemented.
- No unrelated refactoring is performed.
- Generated files such as `.next/` and `node_modules/` are not committed.

## Puzzle Core Gates

Apply when editing files under `src/features/puzzle/`.

- Movement behavior must stay covered by tests.
- Solver behavior must stay covered by tests.
- If `solver.ts` changes, add or update solver tests.
- If `movement.ts` changes, add or update movement tests.
- BFS must not store full move arrays in the queue.
- BFS must not use `queue.shift()`.
- State encoding must use fixed robot order.
- `slideRobot` must stop at walls, board edges, and other robots.
- `applyMove` must not mutate the original robot state.

## UI Gates

Apply when editing `src/app` or `src/components`.

- UI changes must not change solver or movement semantics.
- Step playback must keep `stepIndex` within `0..moves.length`.
- Solve result rendering must handle `null`, solved, and failed results.
- Small screens must remain usable.
- Text must fit inside controls and panels.

## Test Gates

Apply when adding or changing tests.

- Tests must run with `npm run test`.
- Tests should cover behavior, not implementation details.
- Tests must not depend on React rendering unless the selected step is explicitly a UI test step.
- Puzzle core tests should use pure TypeScript functions.

## Documentation Gates

Apply when editing docs.

- Roadmap status must reflect verified work only.
- New workflow instructions must not conflict with `ROADMAP.md`.
- Documentation must mention verification commands when relevant.
- Documentation must keep the project independent and avoid official protected assets or text.
