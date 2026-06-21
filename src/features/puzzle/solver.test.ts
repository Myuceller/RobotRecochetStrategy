import { describe, expect, it } from 'vitest';
import { createEmptyBoard, toIndex } from './board';
import { sampleBoard, samplePuzzle } from './sampleBoard';
import { solvePuzzle } from './solver';
import type { PuzzleState } from './types';

describe('solvePuzzle', () => {
  it('returns a solved result with zero moves when the start state is already the target', () => {
    const board = createEmptyBoard(4, 4);
    const puzzle: PuzzleState = {
      robots: {
        red: toIndex(0, 0, board),
        blue: toIndex(0, 3, board),
        yellow: toIndex(3, 0, board),
        green: toIndex(3, 3, board),
        black: toIndex(2, 2, board),
      },
      targetRobot: 'red',
      targetCell: toIndex(0, 0, board),
    };

    expect(solvePuzzle(board, puzzle)).toEqual({
      found: true,
      moves: [],
      visitedCount: 1,
      depth: 0,
      reason: 'solved',
    });
  });

  it('solves the sample puzzle', () => {
    const result = solvePuzzle(sampleBoard, samplePuzzle);

    expect(result.found).toBe(true);
    expect(result.reason).toBe('solved');
    expect(result.moves.length).toBeGreaterThan(0);
    expect(result.depth).toBe(result.moves.length);
  });

  it('finds the expected first move for the sample puzzle', () => {
    const result = solvePuzzle(sampleBoard, samplePuzzle);

    expect(result.moves[0]).toMatchObject({
      robot: 'red',
      direction: 'right',
      from: samplePuzzle.robots.red,
      to: samplePuzzle.targetCell,
    });
  });

  it('returns maxVisited when the visited limit is too low', () => {
    const result = solvePuzzle(sampleBoard, samplePuzzle, { maxVisited: 0 });

    expect(result.found).toBe(false);
    expect(result.reason).toBe('maxVisited');
  });

  it('returns maxDepth when the depth limit is too low', () => {
    const result = solvePuzzle(sampleBoard, samplePuzzle, { maxDepth: 0 });

    expect(result.found).toBe(false);
    expect(result.reason).toBe('maxDepth');
  });

  it('returns maxQueueSize when the frontier grows beyond the queue guard', () => {
    const board = createEmptyBoard(4, 4);
    const puzzle: PuzzleState = {
      robots: {
        red: toIndex(1, 1, board),
        blue: toIndex(3, 3, board),
        yellow: toIndex(0, 3, board),
        green: toIndex(3, 0, board),
        black: toIndex(2, 2, board),
      },
      targetRobot: 'red',
      targetCell: toIndex(0, 0, board),
    };
    const result = solvePuzzle(board, puzzle, { maxQueueSize: 0 });

    expect(result.found).toBe(false);
    expect(result.reason).toBe('maxQueueSize');
  });
});
