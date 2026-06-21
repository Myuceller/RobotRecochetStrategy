import { describe, expect, it } from 'vitest';
import { getCellWalls, getCenterBlockedCells, hasCornerWalls, toIndex } from './board';
import { fixedUserBoard, fixedUserPuzzle, fixedUserWallSpec } from './fixedUserMap';
import { solvePuzzle } from './solver';

describe('fixed user map', () => {
  it('builds the provided 16x16 wall layout', () => {
    expect(fixedUserWallSpec.size).toBe(16);
    expect(fixedUserBoard.width).toBe(16);
    expect(fixedUserBoard.height).toBe(16);
    expect(fixedUserBoard.walls).toHaveLength(256);
  });

  it('keeps the center block closed', () => {
    for (const cell of getCenterBlockedCells(fixedUserBoard)) {
      expect(getCellWalls(fixedUserBoard, cell)).toEqual({
        top: true,
        right: true,
        bottom: true,
        left: true,
      });
    }
  });

  it('places the fixed target inside a corner wall', () => {
    expect(fixedUserPuzzle.targetCell).toBe(toIndex(1, 2, fixedUserBoard));
    expect(hasCornerWalls(fixedUserBoard, fixedUserPuzzle.targetCell)).toBe(true);
  });

  it('solves the fixed fallback puzzle', () => {
    const result = solvePuzzle(fixedUserBoard, fixedUserPuzzle, {
      maxDepth: 20,
      maxVisited: 100_000,
    });

    expect(result.found).toBe(true);
    expect(result.depth).toBe(1);
    expect(result.moves[0]).toMatchObject({
      robot: 'yellow',
      direction: 'left',
      from: fixedUserPuzzle.robots.yellow,
      to: fixedUserPuzzle.targetCell,
    });
  });
});
