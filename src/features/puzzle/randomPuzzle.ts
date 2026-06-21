import {
  composedPhotoBoardToBoard,
  getRandomPhotoBoard,
  type ComposedPhotoBoard,
  type QuadrantTarget,
} from './boards/photoQuadrants';
import { solvePuzzle } from './solver';
import { getCenterBlockedCells, hasCornerWalls } from './board';
import type { BoardModule } from './moduleTypes';
import type { Board, CellIndex, PuzzleState, RobotColor, SolveResult, TargetRobotColor } from './types';

type RobotColorPhotoTarget = QuadrantTarget & {
  color: TargetRobotColor;
};

export type RandomSource = () => number;

export type RandomPuzzleDifficulty = {
  minDepth?: number;
  maxDepth?: number;
};

export type RandomPuzzleOptions = {
  modules?: BoardModule[];
  random?: RandomSource;
  allowRotation?: boolean;
  targetIndex?: number;
  maxAttempts?: number;
  solveMaxVisited?: number;
  solveMaxDepth?: number;
  solveMaxQueueSize?: number;
  difficulty?: RandomPuzzleDifficulty;
};

export type RandomPuzzleResult = {
  board: Board;
  puzzle: PuzzleState;
  targetTokens?: PhotoTargetToken[];
  solution?: SolveResult;
  attempts: number;
  meta: {
    generatedBy: 'photo-quadrant' | 'photo-quadrant-fallback' | 'photo-quadrant-random';
    minMoves?: number;
    attempts: number;
    boardSource?: 'photo-quadrant';
    source?: 'photo-board-v5';
    order?: ComposedPhotoBoard['meta']['order'];
    rotations?: ComposedPhotoBoard['meta']['rotations'];
    targetId?: number;
    boardSize?: 16;
  };
};

export type PhotoTargetToken = {
  id: number;
  robot: TargetRobotColor;
  cell: CellIndex;
};

export type VerifiedRandomPuzzleResult = RandomPuzzleResult & {
  solution: SolveResult;
  meta: RandomPuzzleResult['meta'] & {
    generatedBy: 'photo-quadrant' | 'photo-quadrant-fallback';
    minMoves: number;
  };
};

const ROBOT_COLORS: RobotColor[] = ['red', 'blue', 'yellow', 'green', 'black'];
const TARGET_ROBOT_COLORS: TargetRobotColor[] = ['red', 'blue', 'yellow', 'green'];
const PHOTO_QUADRANT_FALLBACK_RANDOM_VALUES = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  5 / 255,
  83 / 254,
  201 / 253,
  0,
  4 / 252,
];

function getRandomSource(random?: RandomSource): RandomSource {
  return random ?? Math.random;
}

function createSequenceRandom(values: number[]): RandomSource {
  let index = 0;

  return () => {
    const value = values[index % values.length];
    index += 1;

    return value;
  };
}

function getRandomIndex(length: number, random: RandomSource): number {
  return Math.floor(random() * length);
}

export function pickDistinctCells(
  board: Board,
  count: number,
  random?: RandomSource,
  excludedCells: CellIndex[] = []
): CellIndex[] {
  const cellCount = board.width * board.height;
  const blockedCells = new Set(getCenterBlockedCells(board));
  const excluded = new Set(excludedCells);
  const pool = Array.from({ length: cellCount }, (_, index) => index).filter(
    (cell) => !blockedCells.has(cell) && !excluded.has(cell)
  );

  if (count > pool.length) {
    throw new Error(`Cannot pick ${count} distinct cells from ${pool.length} available cells.`);
  }

  const source = getRandomSource(random);
  const picked: CellIndex[] = [];

  while (picked.length < count) {
    const index = getRandomIndex(pool.length, source);
    const [cell] = pool.splice(index, 1);
    picked.push(cell);
  }

  return picked;
}

export function pickRandomRobotState(
  board: Board,
  random?: RandomSource,
  excludedCells: CellIndex[] = []
): PuzzleState['robots'] {
  const [red, blue, yellow, green, black] = pickDistinctCells(
    board,
    ROBOT_COLORS.length,
    random,
    excludedCells
  );

  return {
    red,
    blue,
    yellow,
    green,
    black,
  };
}

export function pickRandomTargetRobot(random?: RandomSource): TargetRobotColor {
  const source = getRandomSource(random);

  return TARGET_ROBOT_COLORS[getRandomIndex(TARGET_ROBOT_COLORS.length, source)];
}

export function isCornerTargetCell(board: Board, cell: CellIndex): boolean {
  return hasCornerWalls(board, cell);
}

export function getTargetCandidateCells(
  board: Board,
  robots: PuzzleState['robots']
): CellIndex[] {
  const occupiedCells = new Set<CellIndex>(Object.values(robots));
  const blockedCells = new Set(getCenterBlockedCells(board));

  return Array.from({ length: board.width * board.height }, (_, index) => index).filter(
    (cell) =>
      !occupiedCells.has(cell) &&
      !blockedCells.has(cell) &&
      isCornerTargetCell(board, cell)
  );
}

export function pickRandomTargetCell(
  board: Board,
  robots: PuzzleState['robots'],
  random?: RandomSource
): CellIndex {
  const candidates = getTargetCandidateCells(board, robots);

  if (candidates.length === 0) {
    throw new Error('No corner target cells are available.');
  }

  const source = getRandomSource(random);

  return candidates[getRandomIndex(candidates.length, source)];
}

function isTargetRobotColor(value: string): value is TargetRobotColor {
  return TARGET_ROBOT_COLORS.includes(value as TargetRobotColor);
}

export function getPhotoTargetTokens(
  composed: ComposedPhotoBoard,
  board: Board
): PhotoTargetToken[] {
  const blockedCells = new Set(getCenterBlockedCells(board));

  return composed.targets
    .filter((target): target is RobotColorPhotoTarget => isTargetRobotColor(target.color))
    .map((target) => ({
      id: target.id,
      robot: target.color,
      cell: toPhotoTargetCell(board, target),
    }))
    .filter(
      (target) =>
        target.cell >= 0 &&
        target.cell < board.walls.length &&
        !blockedCells.has(target.cell) &&
        isCornerTargetCell(board, target.cell)
    )
    .sort((left, right) => left.id - right.id);
}

function toPhotoTargetCell(board: Board, target: QuadrantTarget): CellIndex {
  return target.y * board.width + target.x;
}

function pickPhotoTarget(
  composed: ComposedPhotoBoard,
  board: Board,
  random: RandomSource,
  targetIndex?: number
): PhotoTargetToken {
  const candidates = getPhotoTargetTokens(composed, board);

  if (candidates.length === 0) {
    throw new Error('No photo quadrant target cells are available.');
  }

  if (targetIndex !== undefined) {
    return candidates[((targetIndex % candidates.length) + candidates.length) % candidates.length];
  }

  return candidates[getRandomIndex(candidates.length, random)];
}

export function generatePuzzleFromPhotoBoard(
  options: RandomPuzzleOptions = { modules: [] }
): {
  board: Board;
  puzzle: PuzzleState;
  composed: ComposedPhotoBoard;
  selectedTarget: PhotoTargetToken;
  targetTokens: PhotoTargetToken[];
  meta: {
    source: 'photo-board-v5';
    order: ComposedPhotoBoard['meta']['order'];
    rotations: ComposedPhotoBoard['meta']['rotations'];
    targetId: number;
    boardSize: 16;
  };
} {
  const source = getRandomSource(options.random);
  const composed = getRandomPhotoBoard(source);
  const board = composedPhotoBoardToBoard(composed);
  const targetTokens = getPhotoTargetTokens(composed, board);
  const selectedTarget = pickPhotoTarget(composed, board, source, options.targetIndex);
  const robots = pickRandomRobotState(board, source, [selectedTarget.cell]);
  const puzzle: PuzzleState = {
    robots,
    targetRobot: selectedTarget.robot,
    targetCell: selectedTarget.cell,
    targetId: selectedTarget.id,
  };

  return {
    board,
    puzzle,
    composed,
    selectedTarget,
    targetTokens,
    meta: {
      source: composed.meta.source,
      order: composed.meta.order,
      rotations: composed.meta.rotations,
      targetId: selectedTarget.id,
      boardSize: composed.size,
    },
  };
}

export function createRandomPuzzleCandidate(
  options: RandomPuzzleOptions = { modules: [] }
): RandomPuzzleResult {
  const { board, puzzle, targetTokens, meta } = generatePuzzleFromPhotoBoard(options);

  return {
    board,
    puzzle,
    targetTokens,
    attempts: 1,
    meta: {
      generatedBy: 'photo-quadrant-random',
      attempts: 1,
      boardSource: 'photo-quadrant',
      source: meta.source,
      order: meta.order,
      rotations: meta.rotations,
      targetId: meta.targetId,
      boardSize: meta.boardSize,
    },
  };
}

const photoQuadrantFallbackCandidate = generatePuzzleFromPhotoBoard({
  modules: [],
  random: createSequenceRandom(PHOTO_QUADRANT_FALLBACK_RANDOM_VALUES),
});

export const FALLBACK_SOLVABLE_PUZZLES: Array<{
  board: Board;
  puzzle: PuzzleState;
}> = [
  {
    board: photoQuadrantFallbackCandidate.board,
    puzzle: photoQuadrantFallbackCandidate.puzzle,
  },
];

function getFallbackSolvablePuzzle(
  solveMaxVisited: number,
  solveMaxDepth: number,
  solveMaxQueueSize: number,
  attempts: number,
  minDepth: number,
  maxDepth: number
): VerifiedRandomPuzzleResult {
  const fallback = photoQuadrantFallbackCandidate;
  const fallbackSolveOptions = {
    maxVisited: solveMaxVisited,
    maxDepth: Math.max(maxDepth, solveMaxDepth),
    maxQueueSize: solveMaxQueueSize,
  };
  const solution = solvePuzzle(fallback.board, fallback.puzzle, {
    maxVisited: fallbackSolveOptions.maxVisited,
    maxDepth: fallbackSolveOptions.maxDepth,
    maxQueueSize: fallbackSolveOptions.maxQueueSize,
  });

  if (solution.found && solution.depth >= minDepth && solution.depth <= maxDepth) {
    return {
      board: fallback.board,
      puzzle: fallback.puzzle,
      targetTokens: fallback.targetTokens,
      solution,
      attempts,
      meta: {
        generatedBy: 'photo-quadrant-fallback',
        minMoves: solution.moves.length,
        attempts,
        boardSource: 'photo-quadrant',
        source: fallback.meta.source,
        order: fallback.meta.order,
        rotations: fallback.meta.rotations,
        targetId: fallback.meta.targetId,
        boardSize: fallback.meta.boardSize,
      },
    };
  }

  for (const fallbackPuzzle of FALLBACK_SOLVABLE_PUZZLES) {
    const fallbackSolution = solvePuzzle(fallbackPuzzle.board, fallbackPuzzle.puzzle, {
      maxVisited: fallbackSolveOptions.maxVisited,
      maxDepth: fallbackSolveOptions.maxDepth,
      maxQueueSize: fallbackSolveOptions.maxQueueSize,
    });

    if (fallbackSolution.found && fallbackSolution.depth >= minDepth && fallbackSolution.depth <= maxDepth) {
      return {
        board: fallbackPuzzle.board,
        puzzle: fallbackPuzzle.puzzle,
        targetTokens: fallback.targetTokens,
        solution: fallbackSolution,
        attempts,
        meta: {
          generatedBy: 'photo-quadrant-fallback',
          minMoves: fallbackSolution.moves.length,
          attempts,
          boardSource: 'photo-quadrant',
          source: fallback.meta.source,
          order: fallback.meta.order,
          rotations: fallback.meta.rotations,
          targetId: fallback.meta.targetId,
          boardSize: fallback.meta.boardSize,
        },
      };
    }
  }

  throw new Error(
    `No verified puzzle found in the requested ${minDepth}-${maxDepth} move range. Try again or choose an easier difficulty.`
  );
}

export function createRandomPuzzle(options: RandomPuzzleOptions): VerifiedRandomPuzzleResult {
  const source = getRandomSource(options.random);
  const maxAttempts = options.maxAttempts ?? 50;
  const solveMaxVisited = options.solveMaxVisited ?? 100_000;
  const solveMaxDepth = options.solveMaxDepth ?? 50;
  const solveMaxQueueSize = options.solveMaxQueueSize ?? 100_000;
  const minDepth = options.difficulty?.minDepth ?? 3;
  const maxDepth = options.difficulty?.maxDepth ?? solveMaxDepth;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { board, puzzle, targetTokens, meta } = generatePuzzleFromPhotoBoard({
        ...options,
        random: source,
      });
      const solution = solvePuzzle(board, puzzle, {
        maxVisited: solveMaxVisited,
        maxDepth: solveMaxDepth,
        maxQueueSize: solveMaxQueueSize,
      });

      if (solution.found && solution.depth >= minDepth && solution.depth <= maxDepth) {
        return {
          board,
          puzzle,
          targetTokens,
          solution,
          attempts: attempt,
          meta: {
            generatedBy: 'photo-quadrant',
            minMoves: solution.moves.length,
            attempts: attempt,
            boardSource: 'photo-quadrant',
            source: meta.source,
            order: meta.order,
            rotations: meta.rotations,
            targetId: meta.targetId,
            boardSize: meta.boardSize,
          },
        };
      }
    } catch {
      // Invalid candidates are discarded and the generator tries another board.
    }
  }

  return getFallbackSolvablePuzzle(
    solveMaxVisited,
    solveMaxDepth,
    solveMaxQueueSize,
    maxAttempts,
    minDepth,
    maxDepth
  );
}

export function generateSolvablePuzzle(options: RandomPuzzleOptions): VerifiedRandomPuzzleResult {
  return createRandomPuzzle(options);
}
