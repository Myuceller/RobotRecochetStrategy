import { describe, expect, it } from 'vitest';
import { getCellWalls, hasCornerWalls, toIndex } from './board';
import {
  createPuzzleFromWallSpec,
  parseWallSpecImportFromJson,
  validateWallSpec,
  wallSpecToBoard,
  type WallSpec,
} from './wallSpec';

const spec: WallSpec = {
  size: 4,
  outerWalls: true,
  centerBlock: [],
  vWalls: [[2, 1]],
  hWalls: [[2, 1]],
  targets: [{ x: 2, y: 1, color: 'yellow', shape: 'circle' }],
};

describe('wallSpec import', () => {
  it('validates a wall spec shape', () => {
    expect(validateWallSpec(spec)).toEqual(spec);
  });

  it('converts vertical wall coordinates to left cell walls', () => {
    const board = wallSpecToBoard(spec);
    const targetCell = toIndex(1, 2, board);

    expect(getCellWalls(board, targetCell).left).toBe(true);
    expect(getCellWalls(board, toIndex(1, 1, board)).right).toBe(true);
  });

  it('converts horizontal wall coordinates to top cell walls', () => {
    const board = wallSpecToBoard(spec);
    const targetCell = toIndex(1, 2, board);

    expect(getCellWalls(board, targetCell).top).toBe(true);
    expect(getCellWalls(board, toIndex(0, 2, board)).bottom).toBe(true);
  });

  it('keeps outer walls when requested', () => {
    const board = wallSpecToBoard(spec);

    expect(getCellWalls(board, toIndex(0, 0, board)).top).toBe(true);
    expect(getCellWalls(board, toIndex(0, 0, board)).left).toBe(true);
    expect(getCellWalls(board, toIndex(3, 3, board)).right).toBe(true);
    expect(getCellWalls(board, toIndex(3, 3, board)).bottom).toBe(true);
  });

  it('creates a puzzle using the first target inside corner walls', () => {
    const board = wallSpecToBoard(spec);
    const result = createPuzzleFromWallSpec(spec, board);

    expect(result.puzzle.targetRobot).toBe('yellow');
    expect(result.puzzle.targetCell).toBe(toIndex(1, 2, board));
    expect(hasCornerWalls(board, result.puzzle.targetCell)).toBe(true);
  });

  it('parses a wall spec import from JSON', () => {
    const result = parseWallSpecImportFromJson(JSON.stringify(spec));

    expect(result.board.width).toBe(4);
    expect(result.board.height).toBe(4);
    expect(result.puzzle.targetRobot).toBe('yellow');
  });

  it('throws when no target is inside a corner wall', () => {
    const badSpec: WallSpec = {
      size: 4,
      vWalls: [],
      hWalls: [],
      targets: [{ x: 2, y: 1, color: 'yellow', shape: 'circle' }],
    };
    const board = wallSpecToBoard(badSpec);

    expect(() => createPuzzleFromWallSpec(badSpec, board)).toThrow('corner wall');
  });
});
