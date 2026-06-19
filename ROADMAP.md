# Sliding Robot Lab Roadmap

Use this roadmap as the single source of truth for implementation order. Work on only one unchecked step at a time.

## Status

- [x] Step 1: types / board / sampleBoard
- [x] Step 2: movement
- [x] Step 3: encode / solver
- [x] Step 4: UI connection
- [x] Step 5: Next/Tailwind runtime skeleton
- [x] Step 6: MVP UX polish
- [x] Step 7: puzzle core unit tests
- [x] Step 7.5: BFS search progress visualization
- [x] Step 7.6: BFS depth statistics and speed visualization
- [x] Step 7.7: 8x8 modular board assembly
- [x] Step 7.8: random modular board generation
- [x] Step 7.9: random puzzle generation
- [x] Step 7.10: random puzzle UI connection
- [x] Step 7.11: random puzzle generation worker
- [x] Step 7.12: random puzzle difficulty presets
- [x] Step 7.13: solution playback animation
- [x] Step 7.14: modular board center block and L-wall structure
- [x] Step 7.15: modular board edge stopper structure
- [x] Step 8: sample puzzle selection UI
- [x] Step 9: move solver execution to a Web Worker
- [x] Step 10.1: custom puzzle editor for robots and target
- [x] Step 10: board editor MVP
- [x] Step 11: puzzle save/load
- [ ] Step 12: hint mode
- [ ] Step 13: strategy/learning explanation panel
- [ ] Step 14: deployment preparation
- [ ] Step 15: README/portfolio cleanup

## Step Details

### Step 1: types / board / sampleBoard

Goal: Define the core puzzle types, board helpers, and one simple solvable sample puzzle.

Editable files:
- `src/features/puzzle/types.ts`
- `src/features/puzzle/board.ts`
- `src/features/puzzle/sampleBoard.ts`

Do not edit:
- React UI files
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/solver.ts`

Done when:
- Cell index and row/col conversions exist.
- Board walls are represented per cell.
- A 16x16 sample puzzle exists and is intentionally simple.

Verify:
- `npm run lint`
- `npm run build`

### Step 2: movement

Goal: Implement sliding movement rules for robots.

Editable files:
- `src/features/puzzle/movement.ts`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/encode.ts`
- React UI files

Done when:
- `slideRobot` stops at walls, board edges, and other robots.
- `generateMoves` returns valid moves only.
- `applyMove` returns a new robot state without mutation.

Verify:
- `npm run lint`
- `npm run build`
- `npm run test` if tests exist

### Step 3: encode / solver

Goal: Implement deterministic state encoding and BFS shortest-path solving.

Editable files:
- `src/features/puzzle/encode.ts`
- `src/features/puzzle/solver.ts`

Do not edit:
- React UI files
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/sampleBoard.ts`

Done when:
- State keys use fixed robot order.
- BFS uses `parentMap` for path reconstruction.
- The queue does not store move arrays.
- The queue uses a `head` index instead of `shift()`.
- `maxVisited` and `maxDepth` limits exist.

Verify:
- `npm run lint`
- `npm run build`
- `npm run test` if tests exist

### Step 4: UI connection

Goal: Render the sample puzzle, run the solver from a button, and replay the solution.

Editable files:
- `src/app/page.tsx`
- `src/components/BoardView.tsx`
- `src/components/BoardCell.tsx`
- `src/components/RobotToken.tsx`
- `src/components/TargetMarker.tsx`
- `src/components/SolutionPanel.tsx`
- `src/components/MoveList.tsx`
- `src/components/PlaybackControls.tsx`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/sampleBoard.ts`

Done when:
- The board renders from `sampleBoard`.
- Solve runs `solvePuzzle(sampleBoard, samplePuzzle)`.
- Move list and step playback work.

Verify:
- `npm run lint`
- `npm run build`

### Step 5: Next/Tailwind runtime skeleton

Goal: Add the minimal Next.js, TypeScript, Tailwind, and lint/build setup needed to run the MVP.

Editable files:
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `eslint.config.mjs`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `.gitignore`

Do not edit:
- Puzzle core logic files
- React feature behavior beyond import fixes

Done when:
- `npm install` works.
- `npm run dev` serves the App Router page.
- Tailwind styles apply.

Verify:
- `npm run lint`
- `npm run build`

### Step 6: MVP UX polish

Goal: Improve the usability of the existing MVP without adding new features.

Editable files:
- `src/app/page.tsx`
- `src/components/SolutionPanel.tsx`
- `src/components/MoveList.tsx`
- `src/components/PlaybackControls.tsx`
- `src/components/BoardView.tsx`
- `src/components/BoardCell.tsx`
- `src/components/RobotToken.tsx`
- `src/components/TargetMarker.tsx`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/sampleBoard.ts`

Done when:
- Solve has a visible calculating state.
- Result details are clear.
- Playback controls cannot move out of range.
- The 16x16 board fits reasonably on common screens.

Verify:
- `npm run lint`
- `npm run build`

### Step 7: puzzle core unit tests

Goal: Add unit tests for board, movement, encode, and solver correctness.

Editable files:
- `package.json`
- `package-lock.json`
- `vitest.config.ts`
- `src/features/puzzle/*.test.ts`
- `tsconfig.json` if required for test typing
- `eslint.config.mjs` if required for test linting

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/sampleBoard.ts`
- React UI files

Done when:
- Board utility tests exist.
- Movement rule tests exist.
- Encode tests exist.
- Solver tests exist.
- Tests run with `npm run test`.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 7.5: BFS search progress visualization

Goal: Add an async chunked BFS solver that emits sampled progress data for UI visualization without changing the existing synchronous solver.

Editable files:
- `src/features/puzzle/progressSolver.ts`
- `src/features/puzzle/types.ts`
- `src/app/page.tsx`
- `src/components/SearchProgressPanel.tsx`
- `src/components/BoardView.tsx`
- `src/components/BoardCell.tsx`
- `src/components/SolutionPanel.tsx`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/sampleBoard.ts`
- Web Worker files
- Board editor files

Done when:
- `solvePuzzleWithProgress` runs BFS with `head` index queue traversal.
- Progress events include status, visited count, depth, frontier size, elapsed time, heatmap, and recent sampled cells.
- The main page uses the progress solver and supports cancellation.
- Board cells can visualize heatmap and recent target-robot positions.
- Existing solution playback still works for solved results.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 7.6: BFS depth statistics and speed visualization

Goal: Make BFS progress visualization more useful for analysis by showing depth layer expansion statistics and search speed.

Editable files:
- `src/features/puzzle/types.ts`
- `src/features/puzzle/progressSolver.ts`
- `src/components/SearchProgressPanel.tsx`
- `src/app/page.tsx` only for passing progress fields
- `src/components/BoardView.tsx` only for heatmap normalization
- `src/components/BoardCell.tsx` only for heatmap presentation if needed

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/sampleBoard.ts`
- Web Worker files
- Board editor files

Done when:
- Progress data includes `depthCounts`, `statesPerSecond`, and `maxHeat`.
- BFS increments depth counts when new states are visited.
- Search progress panel shows speed and depth layer bars.
- Heatmap intensity can use max heat normalization.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 7.7: 8x8 modular board assembly

Goal: Define 8x8 board modules and assemble four modules into a 16x16 `Board` compatible with the existing solver and movement logic.

Editable files:
- `src/features/puzzle/moduleTypes.ts`
- `src/features/puzzle/moduleBoard.ts`
- `src/features/puzzle/sampleModules.ts`
- `src/features/puzzle/moduleBoard.test.ts`
- `ROADMAP.md`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/progressSolver.ts`
- `src/features/puzzle/solverWorker.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/sampleBoard.ts`
- React UI files

Done when:
- Four 8x8 modules can be placed in 2x2 slots.
- Module rotations rotate both coordinates and walls.
- The assembled board is a 16x16 `Board`.
- Missing or duplicate slots throw errors.
- Sample modules are original test data, not official board data.
- Tests cover rotation, assembly, validation, and movement compatibility.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 7.8: random modular board generation

Goal: Generate a random 16x16 modular board from a registry of 8x8 `BoardModule` entries.

Editable files:
- `src/features/puzzle/randomModularBoard.ts`
- `src/features/puzzle/randomModularBoard.test.ts`
- `src/features/puzzle/moduleTypes.ts` only if minimal type additions are needed
- `ROADMAP.md`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/progressSolver.ts`
- `src/features/puzzle/solverWorker.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/sampleBoard.ts`
- React UI files
- `package.json`

Done when:
- Four modules can be picked without duplicates.
- Slots can be shuffled deterministically when a random source is injected.
- Optional rotation can be enabled or disabled.
- The result contains both `ModularBoardConfig` and assembled 16x16 `Board`.
- Tests cover deterministic random behavior and board shape.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 7.9: random puzzle generation

Goal: Generate robot starts and a target on a random modular board, then return only puzzles verified as solvable by the existing synchronous solver.

Editable files:
- `src/features/puzzle/randomPuzzle.ts`
- `src/features/puzzle/randomPuzzle.test.ts`
- `src/features/puzzle/types.ts` only if minimal type additions are needed
- `ROADMAP.md`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/progressSolver.ts`
- `src/features/puzzle/solverWorker.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/sampleBoard.ts`
- React UI files
- `package.json`

Done when:
- Robot starts are generated on four distinct cells.
- Target cell does not overlap robot starts.
- Target robot is selected from the four robot colors.
- `solvePuzzle` verifies generated puzzles.
- Difficulty filters by solution depth.
- Tests cover success and failure paths with deterministic random input.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 7.10: random puzzle UI connection

Goal: Add active puzzle state to the app and connect random modular puzzle generation to the existing board, worker solver, progress visualization, and playback UI.

Editable files:
- `src/app/page.tsx`
- `src/components/PuzzleControls.tsx`
- `src/components/SolutionPanel.tsx` only for solve button disabled state
- `ROADMAP.md`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/progressSolver.ts`
- `src/features/puzzle/solverWorker.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/sampleBoard.ts`
- `src/features/puzzle/moduleBoard.ts`
- `src/features/puzzle/randomModularBoard.ts`

Done when:
- App state uses `activeBoard` and `activePuzzle`.
- Generate Random Puzzle replaces the active board and puzzle.
- Reset to Sample Puzzle restores the original sample.
- Solve worker receives the active board and puzzle.
- Playback starts from the active puzzle robot state.
- Generation status, attempts, solution depth, and errors are displayed.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 7.11: random puzzle generation worker

Goal: Move random puzzle generation off the main thread while keeping the existing pure generator and solve worker intact.

Editable files:
- `src/features/puzzle/puzzleGeneratorWorker.ts`
- `src/features/puzzle/puzzleGeneratorWorkerTypes.ts`
- `src/app/page.tsx`
- `src/components/PuzzleControls.tsx`
- `ROADMAP.md`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/progressSolver.ts`
- `src/features/puzzle/solverWorker.ts`
- `src/features/puzzle/sampleBoard.ts`
- `src/features/puzzle/moduleBoard.ts`
- `src/features/puzzle/randomModularBoard.ts`
- `src/features/puzzle/randomPuzzle.ts` except for necessary type exports

Done when:
- Generate Random Puzzle runs in a dedicated Web Worker.
- Main thread receives result, error, or cancelled messages.
- Generation and solve workers are managed independently.
- Generate can interrupt an active solve.
- Reset cleans up both generation and solve workers.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 7.12: random puzzle difficulty presets

Goal: Let users choose Easy, Normal, or Hard generation presets and pass the selected preset to the puzzle generation worker.

Editable files:
- `src/features/puzzle/puzzleDifficulty.ts`
- `src/app/page.tsx`
- `src/components/PuzzleControls.tsx`
- `ROADMAP.md`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/progressSolver.ts`
- `src/features/puzzle/solverWorker.ts`
- `src/features/puzzle/randomPuzzle.ts`
- `src/features/puzzle/randomModularBoard.ts`
- `src/features/puzzle/moduleBoard.ts`
- `src/features/puzzle/sampleBoard.ts`

Done when:
- Difficulty presets define depth ranges and solver limits.
- UI can select Easy, Normal, or Hard.
- Generation worker options come from the selected preset.
- Generation info shows difficulty, attempts, and solution depth.
- Failure copy suggests lowering difficulty.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 7.13: solution playback animation

Goal: Add automatic solution playback and highlight the current move path on the board.

Editable files:
- `src/features/puzzle/playback.ts`
- `src/features/puzzle/playback.test.ts`
- `src/app/page.tsx`
- `src/components/PlaybackControls.tsx`
- `src/components/BoardView.tsx`
- `src/components/BoardCell.tsx`
- `src/components/RobotToken.tsx`
- `src/components/SolutionPanel.tsx`
- `ROADMAP.md`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/progressSolver.ts`
- `src/features/puzzle/solverWorker.ts`
- `src/features/puzzle/randomPuzzle.ts`
- `src/features/puzzle/randomModularBoard.ts`
- `src/features/puzzle/moduleBoard.ts`

Done when:
- Play/Pause controls advance `stepIndex` automatically.
- Slow, Normal, Fast, and Ultra speeds exist.
- Playback stops at the final move.
- Current move path highlights from, to, and intermediate cells.
- Active moving robot is visually emphasized.
- Path helper tests cover row, column, reverse, same-cell, and invalid moves.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 7.14: modular board center block and L-wall structure

Goal: Make modular boards reflect the intended 2x2 center block and four L-shaped walls per 8x8 module.

Editable files:
- `src/features/puzzle/board.ts`
- `src/features/puzzle/moduleTypes.ts`
- `src/features/puzzle/moduleBoard.ts`
- `src/features/puzzle/sampleModules.ts`
- `src/features/puzzle/randomPuzzle.ts`
- `src/components/BoardView.tsx`
- `src/components/BoardCell.tsx`
- Related puzzle tests
- `ROADMAP.md`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/progressSolver.ts`
- `src/features/puzzle/solverWorker.ts`
- `src/features/puzzle/puzzleGeneratorWorker.ts`
- `src/features/puzzle/randomModularBoard.ts` except for type compatibility

Done when:
- 16x16 boards expose center blocked cells `[119, 120, 135, 136]`.
- Assembled modular boards apply a four-sided blocked center area.
- Each sample 8x8 module has exactly four `cornerWalls`.
- Module `walls` are generated consistently from `cornerWalls`.
- Corner wall rotation updates both cell and orientation.
- Random robot and target candidates exclude center blocked cells.
- The UI renders center blocked cells as inactive cells.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 7.15: modular board edge stopper structure

Goal: Add edge stopper metadata to each 8x8 module while keeping boards compatible with the existing solver.

Editable files:
- `src/features/puzzle/moduleTypes.ts`
- `src/features/puzzle/moduleBoard.ts`
- `src/features/puzzle/sampleModules.ts`
- Related puzzle tests
- `ROADMAP.md`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/progressSolver.ts`
- `src/features/puzzle/solverWorker.ts`
- `src/features/puzzle/puzzleGeneratorWorker.ts`
- `src/features/puzzle/randomModularBoard.ts` except for type compatibility

Done when:
- `BoardModule` can carry exactly two `edgeStoppers`.
- Each sample module has one left/right stopper and one top/bottom stopper.
- Edge stopper offsets are validated.
- Sample module `walls` are generated from `cornerWalls` only.
- `assembleModularBoard` applies edge stoppers only when they land on the final 16x16 outer edge.
- The assembled 16x16 board does not add straight edge-stopper walls on center seams.
- Edge stopper rotation updates edge and offset.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 8: sample puzzle selection UI

Goal: Allow users to choose between multiple built-in sample puzzles.

Editable files:
- `src/features/puzzle/sampleBoard.ts` or a new sample puzzle data file
- `src/app/page.tsx`
- `src/components/*` needed for the selector
- Tests for sample puzzle validity if added

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/movement.ts`
- Existing tests except to add coverage for new sample data

Done when:
- At least 2 sample puzzles are available.
- The selected sample updates board, robots, target, result, and playback state.
- Solve runs against the selected puzzle.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 9: move solver execution to a Web Worker

Goal: Prevent long solver runs from blocking the UI.

Editable files:
- Worker file under `src/features/puzzle/` or `src/workers/`
- `src/app/page.tsx`
- UI state components as needed for worker status
- Tests for pure worker message helpers if added

Do not edit:
- Solver algorithm behavior
- Movement rules
- Sample puzzle semantics

Done when:
- Solve requests run outside the main UI thread.
- Loading, success, failure, and cancellation/error states are handled.
- Existing solver tests still pass.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 10.1: custom puzzle editor for robots and target

Goal: Let users edit robot positions and target settings on the active board without editing walls.

Editable files:
- `src/app/page.tsx`
- `src/components/BoardView.tsx`
- `src/components/BoardCell.tsx`
- `src/components/PuzzleControls.tsx`
- `src/components/PuzzleEditorPanel.tsx`
- `src/features/puzzle/editor.ts`
- Editor helper tests
- `ROADMAP.md`

Do not edit:
- `src/features/puzzle/solver.ts`
- `src/features/puzzle/movement.ts`
- `src/features/puzzle/progressSolver.ts`
- `src/features/puzzle/solverWorker.ts`
- `src/features/puzzle/puzzleGeneratorWorker.ts`
- `src/features/puzzle/randomPuzzle.ts`
- `src/features/puzzle/moduleBoard.ts`
- `src/features/puzzle/samplePuzzles.ts`

Done when:
- Users can turn editor mode on or off.
- Users can place one selected robot on a valid empty cell.
- Users can place the target on a valid empty cell.
- Users can change the target robot.
- Center blocked cells and occupied robot cells reject placement.
- Editing marks the current puzzle as custom and clears stale result/progress/playback state.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 10: board editor MVP

Goal: Add a minimal editor for robot positions, target cell, and walls.

Editable files:
- `src/app/page.tsx`
- `src/components/*` editor components
- `src/features/puzzle/board.ts` only for non-breaking helper additions
- Tests for new board helper behavior

Do not edit:
- Solver algorithm behavior
- Existing movement semantics
- Official game assets or board data

Done when:
- Users can set four robot positions.
- Users can set target robot and target cell.
- Users can add/remove simple cell walls.
- Solver runs on edited board data.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 11: puzzle save/load

Goal: Add local save/load for user-created puzzles.

Editable files:
- Serialization helpers under `src/features/puzzle/`
- UI components for save/load
- Tests for serialization and validation

Do not edit:
- Solver algorithm behavior
- Movement semantics
- Backend, database, or login code

Done when:
- Puzzle state can be serialized.
- Puzzle state can be restored.
- Invalid data is rejected safely.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 12: hint mode

Goal: Let users reveal solution steps gradually.

Editable files:
- `src/app/page.tsx`
- `src/components/SolutionPanel.tsx`
- `src/components/MoveList.tsx`
- New hint UI components if needed

Do not edit:
- Solver algorithm behavior unless tests require non-breaking output additions
- Movement rules

Done when:
- Users can reveal the next suggested move without exposing the full list.
- Playback stays consistent with revealed hints.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 13: strategy/learning explanation panel

Goal: Add educational explanations for movement and solver results.

Editable files:
- New explanation panel components
- `src/app/page.tsx`
- Static copy/data files

Do not edit:
- Solver algorithm behavior
- Movement rules
- Official rulebook text

Done when:
- The panel explains the current move in original wording.
- The app does not use official game text or protected visual design.

Verify:
- `npm run lint`
- `npm run build`
- `npm run test` if logic changes

### Step 14: deployment preparation

Goal: Prepare the app for deployment.

Editable files:
- Deployment config files
- Metadata files
- README deployment section
- Environment docs if needed

Do not edit:
- Puzzle core behavior
- UI feature behavior unless required by deployment

Done when:
- Production build succeeds.
- Deployment instructions are documented.
- Generated files are ignored.

Verify:
- `npm run test`
- `npm run lint`
- `npm run build`

### Step 15: README/portfolio cleanup

Goal: Document the project clearly for users and portfolio review.

Editable files:
- `README.md`
- Screenshots or docs assets if added
- `ROADMAP.md` if status changes are needed

Do not edit:
- Puzzle core behavior
- UI feature behavior

Done when:
- README explains purpose, stack, features, and commands.
- IP safety notes are included.
- MVP limitations and next steps are clear.

Verify:
- `npm run lint`
- `npm run build`
- `npm run test`
