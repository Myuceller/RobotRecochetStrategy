import { describe, expect, it } from 'vitest';
import { getCenterBlockedCells } from './board';
import { isCornerTargetCell } from './randomPuzzle';
import { samplePuzzles } from './samplePuzzles';
import { solvePuzzle } from './solver';
import type { CellIndex } from './types';

describe('samplePuzzles', () => {
  it('contains at least two sample puzzles with unique ids', () => {
    const ids = samplePuzzles.map((sample) => sample.id);

    expect(samplePuzzles.length).toBeGreaterThanOrEqual(2);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses a photo quadrant puzzle as the initial app sample', () => {
    expect(samplePuzzles[0]).toMatchObject({
      id: 'photo-quadrant-generated',
      source: 'photo-quadrant-sample',
    });
  });

  it('keeps board wall counts consistent with board dimensions', () => {
    for (const sample of samplePuzzles) {
      expect(sample.board.walls).toHaveLength(sample.board.width * sample.board.height);
    }
  });

  it('uses distinct robot positions and a non-overlapping target', () => {
    for (const sample of samplePuzzles) {
      const robotCells = Object.values(sample.puzzle.robots);

      expect(new Set(robotCells).size).toBe(robotCells.length);
      expect(robotCells).not.toContain(sample.puzzle.targetCell);
    }
  });

  it('solves every sample puzzle and matches expected depth when provided', () => {
    for (const sample of samplePuzzles) {
      const result = solvePuzzle(sample.board, sample.puzzle);

      expect(result.found).toBe(true);

      if (sample.expectedDepth !== undefined) {
        expect(result.depth).toBe(sample.expectedDepth);
      }
    }
  });

  it('keeps modular sample robots and targets out of center blocked cells', () => {
    for (const sample of samplePuzzles.filter((item) => item.source === 'modular-sample')) {
      const blockedCells = new Set<CellIndex>(getCenterBlockedCells(sample.board));
      const robotCells = Object.values(sample.puzzle.robots);

      expect(robotCells.some((cell) => blockedCells.has(cell))).toBe(false);
      expect(blockedCells.has(sample.puzzle.targetCell)).toBe(false);
    }
  });

  it('places sample targets inside a corner wall target cell', () => {
    for (const sample of samplePuzzles) {
      expect(isCornerTargetCell(sample.board, sample.puzzle.targetCell)).toBe(true);
    }
  });
});
