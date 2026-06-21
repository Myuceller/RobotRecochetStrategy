import { describe, expect, it } from 'vitest';
import { addCenterBlock, addWall, createEmptyBoard, getCenterBlockedCells, toIndex } from './board';
import {
  createRandomPuzzleCandidate,
  createRandomPuzzle,
  FALLBACK_SOLVABLE_PUZZLES,
  generateSolvablePuzzle,
  generatePuzzleFromPhotoBoard,
  getTargetCandidateCells,
  isCornerTargetCell,
  pickDistinctCells,
  pickRandomRobotState,
  pickRandomTargetCell,
  pickRandomTargetRobot,
} from './randomPuzzle';
import { sampleModules } from './sampleModules';
import { solvePuzzle } from './solver';
import { applyMove } from './movement';
import type { RobotColor, RobotState } from './types';

function createMockRandom(values: number[]): () => number {
  let index = 0;

  return () => {
    const value = values[index % values.length];
    index += 1;

    return value;
  };
}

function createSeededRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;

    return state / 0x100000000;
  };
}

function applyMoves(robots: RobotState, moves: ReturnType<typeof solvePuzzle>['moves']): RobotState {
  return moves.reduce((currentRobots, move) => applyMove(currentRobots, move), robots);
}

const ROBOT_COLORS: RobotColor[] = ['red', 'blue', 'yellow', 'green', 'black'];
const TARGET_ROBOT_COLORS: RobotColor[] = ['red', 'blue', 'yellow', 'green'];

const SOLVABLE_SEQUENCE = [
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

describe('random puzzle generation', () => {
  it('picks distinct cells', () => {
    const board = createEmptyBoard(4, 4);
    const cells = pickDistinctCells(board, 4, createMockRandom([0, 0.5, 0.25, 0.75]));

    expect(cells).toHaveLength(4);
    expect(new Set(cells).size).toBe(4);
  });

  it('throws when count is greater than the number of cells', () => {
    const board = createEmptyBoard(2, 2);

    expect(() => pickDistinctCells(board, 5)).toThrow('Cannot pick 5 distinct cells');
  });

  it('places robots on different cells', () => {
    const board = createEmptyBoard(16, 16);
    const robots = pickRandomRobotState(board, createMockRandom([0, 0.25, 0.5, 0.75, 0.9]));
    const cells = Object.values(robots);

    expect(cells).toHaveLength(ROBOT_COLORS.length);
    expect(new Set(cells).size).toBe(ROBOT_COLORS.length);
  });

  it('does not pick center blocked cells for distinct cell selection', () => {
    const board = addCenterBlock(createEmptyBoard(16, 16));
    const blockedCells = getCenterBlockedCells(board);
    const cells = pickDistinctCells(board, 20, createMockRandom([0.47, 0.48, 0.52, 0.53, 0.1]));

    expect(cells.some((cell) => blockedCells.includes(cell))).toBe(false);
  });

  it('does not place robots on center blocked cells', () => {
    const board = addCenterBlock(createEmptyBoard(16, 16));
    const blockedCells = getCenterBlockedCells(board);
    const robots = pickRandomRobotState(board, createMockRandom([0.47, 0.48, 0.52, 0.53, 0.1]));

    expect(Object.values(robots).some((cell) => blockedCells.includes(cell))).toBe(false);
  });

  it('picks a target cell that does not overlap robot cells', () => {
    let board = createEmptyBoard(4, 4);
    board = addWall(board, toIndex(1, 1, board), 'right');
    board = addWall(board, toIndex(1, 1, board), 'down');
    const robots = {
      red: toIndex(0, 0, board),
      blue: toIndex(0, 1, board),
      yellow: toIndex(0, 2, board),
      green: toIndex(0, 3, board),
      black: toIndex(3, 3, board),
    };
    const targetCell = pickRandomTargetCell(board, robots, createMockRandom([0]));

    expect(Object.values(robots)).not.toContain(targetCell);
    expect(isCornerTargetCell(board, targetCell)).toBe(true);
  });

  it('does not pick a target from a plain middle cell without corner walls', () => {
    const board = createEmptyBoard(4, 4);
    const robots = {
      red: toIndex(0, 0, board),
      blue: toIndex(0, 1, board),
      yellow: toIndex(0, 2, board),
      green: toIndex(0, 3, board),
      black: toIndex(3, 3, board),
    };

    expect(getTargetCandidateCells(board, robots)).toEqual([]);
    expect(() => pickRandomTargetCell(board, robots, createMockRandom([0]))).toThrow(
      'No corner target cells'
    );
  });

  it('does not pick center blocked cells for a target cell', () => {
    let board = addCenterBlock(createEmptyBoard(16, 16));
    board = addWall(board, toIndex(1, 1, board), 'right');
    board = addWall(board, toIndex(1, 1, board), 'down');
    const blockedCells = getCenterBlockedCells(board);
    const robots = {
      red: toIndex(0, 0, board),
      blue: toIndex(0, 1, board),
      yellow: toIndex(0, 2, board),
      green: toIndex(0, 3, board),
      black: toIndex(15, 15, board),
    };
    const targetCell = pickRandomTargetCell(board, robots, createMockRandom([0.47]));

    expect(blockedCells).not.toContain(targetCell);
    expect(isCornerTargetCell(board, targetCell)).toBe(true);
  });

  it('picks one of the robot colors as target robot', () => {
    expect(TARGET_ROBOT_COLORS).toContain(pickRandomTargetRobot(createMockRandom([0])));
    expect(TARGET_ROBOT_COLORS).toContain(pickRandomTargetRobot(createMockRandom([0.99])));
    expect(pickRandomTargetRobot(createMockRandom([0.99]))).not.toBe('black');
  });

  it('creates a solvable random puzzle', () => {
    const result = createRandomPuzzle({
      modules: sampleModules,
      random: createMockRandom(SOLVABLE_SEQUENCE),
      allowRotation: false,
      maxAttempts: 5,
      difficulty: {
        minDepth: 1,
        maxDepth: 50,
      },
    });

    expect(result.board.width).toBe(16);
    expect(result.board.height).toBe(16);
    expect(result.board.walls).toHaveLength(256);
    expect(result.solution.found).toBe(true);
    expect(result.solution.depth).toBeGreaterThanOrEqual(1);
    expect(result.solution.depth).toBeLessThanOrEqual(50);
    expect(result.meta.generatedBy).toBe('photo-quadrant');
    expect(result.meta.boardSource).toBe('photo-quadrant');
    expect(result.meta.source).toBe('photo-board-v5');
    expect(result.meta.boardSize).toBe(16);
    expect(result.meta.targetId).toBeTypeOf('number');
    expect(result.meta.order).toBeDefined();
    expect(result.meta.rotations).toBeDefined();
    expect(result.meta.minMoves).toBe(result.solution.moves.length);
    expect(result.meta.attempts).toBe(result.attempts);
    expect(result.attempts).toBeGreaterThanOrEqual(1);
    expect(result.attempts).toBeLessThanOrEqual(5);
    expect(Object.values(result.puzzle.robots).some((cell) => getCenterBlockedCells(result.board).includes(cell))).toBe(false);
    expect(getCenterBlockedCells(result.board)).not.toContain(result.puzzle.targetCell);
    expect(isCornerTargetCell(result.board, result.puzzle.targetCell)).toBe(true);
  });

  it('generates a photo quadrant candidate puzzle before solver validation', () => {
    const result = generatePuzzleFromPhotoBoard({
      modules: sampleModules,
      random: createMockRandom(SOLVABLE_SEQUENCE),
    });

    expect(result.board.width).toBe(16);
    expect(result.board.height).toBe(16);
    expect(result.composed.meta.source).toBe('photo-board-v5');
    expect(result.composed.blockedCells).toEqual(
      expect.arrayContaining([
        { x: 7, y: 7 },
        { x: 8, y: 7 },
        { x: 7, y: 8 },
        { x: 8, y: 8 },
      ])
    );
    expect(result.selectedTarget.robot).toBe(result.puzzle.targetRobot);
    expect(result.selectedTarget.cell).toBe(result.puzzle.targetCell);
    expect(result.selectedTarget.id).toBe(result.puzzle.targetId);
    expect(result.targetTokens).toHaveLength(16);
    expect(result.targetTokens.map((token) => token.id)).toEqual(
      Array.from({ length: 16 }, (_, index) => index + 1)
    );
    expect(Object.values(result.puzzle.robots)).not.toContain(result.puzzle.targetCell);
    expect(isCornerTargetCell(result.board, result.puzzle.targetCell)).toBe(true);
    expect(getCenterBlockedCells(result.board)).not.toContain(result.puzzle.targetCell);
  });

  it('uses a fixed target token sequence when targetIndex is provided', () => {
    const first = createRandomPuzzleCandidate({
      modules: sampleModules,
      random: createMockRandom(SOLVABLE_SEQUENCE),
      targetIndex: 0,
    });
    const second = createRandomPuzzleCandidate({
      modules: sampleModules,
      random: createMockRandom(SOLVABLE_SEQUENCE),
      targetIndex: 1,
    });

    expect(first.targetTokens).toHaveLength(16);
    expect(first.puzzle.targetCell).toBe(first.targetTokens?.[0].cell);
    expect(first.puzzle.targetRobot).toBe(first.targetTokens?.[0].robot);
    expect(first.puzzle.targetId).toBe(first.targetTokens?.[0].id);
    expect(second.puzzle.targetCell).toBe(second.targetTokens?.[1].cell);
    expect(second.puzzle.targetRobot).toBe(second.targetTokens?.[1].robot);
    expect(second.puzzle.targetId).toBe(second.targetTokens?.[1].id);
    expect(first.puzzle.targetCell).not.toBe(second.puzzle.targetCell);
    expect(Object.values(first.puzzle.robots)).not.toContain(first.puzzle.targetCell);
    expect(Object.values(second.puzzle.robots)).not.toContain(second.puzzle.targetCell);
  });

  it('creates an unverified random puzzle candidate without pre-solving', () => {
    const result = createRandomPuzzleCandidate({
      modules: sampleModules,
      random: createMockRandom(SOLVABLE_SEQUENCE),
    });

    expect(result.board.width).toBe(16);
    expect(result.board.height).toBe(16);
    expect(result.solution).toBeUndefined();
    expect(result.meta.generatedBy).toBe('photo-quadrant-random');
    expect(result.meta.boardSource).toBe('photo-quadrant');
    expect(result.meta.source).toBe('photo-board-v5');
    expect(result.meta.targetId).toBeTypeOf('number');
    expect(result.puzzle.targetId).toBe(result.meta.targetId);
    expect(result.targetTokens).toHaveLength(16);
    expect(result.targetTokens?.some((token) => token.id === result.puzzle.targetId)).toBe(true);
    expect(new Set(Object.values(result.puzzle.robots)).size).toBe(ROBOT_COLORS.length);
    expect(getCenterBlockedCells(result.board)).not.toContain(result.puzzle.targetCell);
    expect(isCornerTargetCell(result.board, result.puzzle.targetCell)).toBe(true);
  });

  it('generates a photo-quadrant puzzle through the solvable puzzle entrypoint', () => {
    const result = generateSolvablePuzzle({
      modules: sampleModules,
      random: createMockRandom(SOLVABLE_SEQUENCE),
      allowRotation: false,
      maxAttempts: 5,
      difficulty: {
        minDepth: 1,
        maxDepth: 50,
      },
    });

    expect(result.solution.found).toBe(true);
    expect(result.solution.moves.length).toBeGreaterThan(0);
    expect(result.meta.generatedBy).toBe('photo-quadrant');
    expect(result.meta.boardSource).toBe('photo-quadrant');
    expect(result.meta.source).toBe('photo-board-v5');
  });

  it('reaches the target when generated solution moves are applied in order', () => {
    const result = generateSolvablePuzzle({
      modules: sampleModules,
      random: createMockRandom(SOLVABLE_SEQUENCE),
      allowRotation: false,
      maxAttempts: 5,
      difficulty: {
        minDepth: 1,
        maxDepth: 50,
      },
    });
    const finalRobots = applyMoves(result.puzzle.robots, result.solution.moves);

    expect(finalRobots[result.puzzle.targetRobot]).toBe(result.puzzle.targetCell);
  });

  it('does not return an out-of-range fallback when maxAttempts is exceeded', () => {
    expect(() =>
      createRandomPuzzle({
        modules: sampleModules,
        random: createMockRandom(SOLVABLE_SEQUENCE),
        allowRotation: false,
        maxAttempts: 1,
        difficulty: {
          minDepth: 20,
          maxDepth: 20,
        },
        solveMaxDepth: 5,
      })
    ).toThrow('No verified puzzle found');
  });

  it('returns a fallback solvable puzzle when maxAttempts is zero', () => {
    const result = generateSolvablePuzzle({
      modules: sampleModules,
      random: createMockRandom(SOLVABLE_SEQUENCE),
      allowRotation: false,
      maxAttempts: 0,
      solveMaxVisited: 100_000,
      solveMaxQueueSize: 100_000,
      difficulty: {
        minDepth: 1,
        maxDepth: 50,
      },
    });

    expect(result.meta.generatedBy).toBe('photo-quadrant-fallback');
    expect(result.meta.boardSource).toBe('photo-quadrant');
    expect(result.attempts).toBe(0);
    expect(result.solution.found).toBe(true);
  });

  it('filters generated candidates by minDepth before considering fallback', () => {
    expect(() =>
      createRandomPuzzle({
        modules: sampleModules,
        random: createMockRandom(SOLVABLE_SEQUENCE),
        allowRotation: false,
        maxAttempts: 1,
        difficulty: {
          minDepth: 20,
          maxDepth: 50,
        },
      })
    ).toThrow('No verified puzzle found');
  });

  it('keeps every generated puzzle solvable across repeated generations', () => {
    for (let index = 0; index < 20; index += 1) {
      const result = generateSolvablePuzzle({
        modules: sampleModules,
        random: createSeededRandom(index + 1),
        maxAttempts: 3,
        difficulty: {
          minDepth: 1,
          maxDepth: 50,
        },
      });
      const verifiedSolution = solvePuzzle(result.board, result.puzzle, {
        maxVisited: 100_000,
        maxDepth: 50,
      });
      const robotCells = Object.values(result.puzzle.robots);
      const blockedCells = getCenterBlockedCells(result.board);

      expect(['photo-quadrant', 'photo-quadrant-fallback']).toContain(result.meta.generatedBy);
      expect(result.meta.boardSource).toBe('photo-quadrant');
      expect(result.meta.source).toBe('photo-board-v5');
      expect(result.meta.targetId).toBeTypeOf('number');
      expect(result.board.width).toBe(16);
      expect(result.board.height).toBe(16);
      expect(new Set(robotCells).size).toBe(ROBOT_COLORS.length);
      expect(robotCells.some((cell) => blockedCells.includes(cell))).toBe(false);
      expect(blockedCells).not.toContain(result.puzzle.targetCell);
      expect(isCornerTargetCell(result.board, result.puzzle.targetCell)).toBe(true);
      expect(result.solution.found).toBe(true);
      expect(verifiedSolution.found).toBe(true);
      expect(applyMoves(result.puzzle.robots, result.solution.moves)[result.puzzle.targetRobot]).toBe(
        result.puzzle.targetCell
      );
    }
  }, 60_000);

  it('keeps fallback puzzles verified by the solver', () => {
    for (const fallback of FALLBACK_SOLVABLE_PUZZLES) {
      const solution = solvePuzzle(fallback.board, fallback.puzzle);

      expect(solution.found).toBe(true);
      expect(solution.moves.length).toBeGreaterThan(0);
      expect(fallback.puzzle.robots[fallback.puzzle.targetRobot]).not.toBe(fallback.puzzle.targetCell);
      expect(new Set(Object.values(fallback.puzzle.robots)).size).toBe(ROBOT_COLORS.length);
      expect(getCenterBlockedCells(fallback.board)).not.toContain(fallback.puzzle.targetCell);
      expect(isCornerTargetCell(fallback.board, fallback.puzzle.targetCell)).toBe(true);
    }
  });
});
