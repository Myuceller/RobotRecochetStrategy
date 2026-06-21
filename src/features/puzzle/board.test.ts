import { describe, expect, it } from 'vitest';
import {
  addCenterBlock,
  addWall,
  createEmptyBoard,
  getCenterBlockedCells,
  getCellWalls,
  isInside,
  removeWall,
  toIndex,
  toPosition,
  toggleWall,
} from './board';

describe('board utilities', () => {
  it('converts row and column to a cell index', () => {
    const board = createEmptyBoard(16, 16);

    expect(toIndex(0, 0, board)).toBe(0);
    expect(toIndex(2, 3, board)).toBe(35);
    expect(toIndex(15, 15, board)).toBe(255);
  });

  it('converts a cell index to row and column', () => {
    const board = createEmptyBoard(16, 16);

    expect(toPosition(0, board)).toEqual({ row: 0, col: 0 });
    expect(toPosition(35, board)).toEqual({ row: 2, col: 3 });
    expect(toPosition(255, board)).toEqual({ row: 15, col: 15 });
  });

  it('checks whether a row and column are inside the board', () => {
    const board = createEmptyBoard(4, 3);

    expect(isInside(0, 0, board)).toBe(true);
    expect(isInside(2, 3, board)).toBe(true);
    expect(isInside(-1, 0, board)).toBe(false);
    expect(isInside(0, -1, board)).toBe(false);
    expect(isInside(3, 0, board)).toBe(false);
    expect(isInside(0, 4, board)).toBe(false);
  });

  it('creates an empty board with one wall record per cell', () => {
    const board = createEmptyBoard(5, 4);

    expect(board.walls).toHaveLength(20);
    expect(board.walls.every((walls) => !walls.top && !walls.right && !walls.bottom && !walls.left)).toBe(true);
  });

  it('adds a wall to the current cell and the opposite wall to the neighbor', () => {
    const board = createEmptyBoard(4, 4);
    const index = toIndex(1, 1, board);
    const updated = addWall(board, index, 'right');
    const neighborIndex = toIndex(1, 2, updated);

    expect(getCellWalls(updated, index).right).toBe(true);
    expect(getCellWalls(updated, neighborIndex).left).toBe(true);
    expect(getCellWalls(board, index).right).toBe(false);
  });

  it('handles walls facing outside the board without throwing', () => {
    const board = createEmptyBoard(4, 4);
    const index = toIndex(0, 0, board);

    expect(() => addWall(board, index, 'up')).not.toThrow();

    const updated = addWall(board, index, 'up');
    expect(getCellWalls(updated, index).top).toBe(true);
  });

  it('removes a wall from the current cell and the opposite wall from the neighbor', () => {
    const board = createEmptyBoard(4, 4);
    const index = toIndex(1, 1, board);
    const withWall = addWall(board, index, 'right');
    const updated = removeWall(withWall, index, 'right');
    const neighborIndex = toIndex(1, 2, updated);

    expect(getCellWalls(updated, index).right).toBe(false);
    expect(getCellWalls(updated, neighborIndex).left).toBe(false);
    expect(getCellWalls(withWall, index).right).toBe(true);
  });

  it('toggles a missing wall on', () => {
    const board = createEmptyBoard(4, 4);
    const index = toIndex(1, 1, board);
    const updated = toggleWall(board, index, 'down');
    const neighborIndex = toIndex(2, 1, updated);

    expect(getCellWalls(updated, index).bottom).toBe(true);
    expect(getCellWalls(updated, neighborIndex).top).toBe(true);
  });

  it('toggles an existing wall off', () => {
    const board = createEmptyBoard(4, 4);
    const index = toIndex(1, 1, board);
    const withWall = addWall(board, index, 'down');
    const updated = toggleWall(withWall, index, 'down');
    const neighborIndex = toIndex(2, 1, updated);

    expect(getCellWalls(updated, index).bottom).toBe(false);
    expect(getCellWalls(updated, neighborIndex).top).toBe(false);
  });

  it('returns the center blocked cells for a 16x16 board', () => {
    const board = createEmptyBoard(16, 16);

    expect(getCenterBlockedCells(board)).toEqual([119, 120, 135, 136]);
  });

  it('returns no center blocked cells for non-16x16 boards', () => {
    const board = createEmptyBoard(8, 8);

    expect(getCenterBlockedCells(board)).toEqual([]);
  });

  it('adds four-sided walls to the 16x16 center block', () => {
    const board = addCenterBlock(createEmptyBoard(16, 16));

    for (const cell of getCenterBlockedCells(board)) {
      expect(getCellWalls(board, cell)).toEqual({
        top: true,
        right: true,
        bottom: true,
        left: true,
      });
    }
  });

  it('blocks neighboring cells from entering the center block', () => {
    const board = addCenterBlock(createEmptyBoard(16, 16));

    expect(getCellWalls(board, toIndex(6, 7, board)).bottom).toBe(true);
    expect(getCellWalls(board, toIndex(7, 6, board)).right).toBe(true);
    expect(getCellWalls(board, toIndex(7, 9, board)).left).toBe(true);
    expect(getCellWalls(board, toIndex(9, 8, board)).top).toBe(true);
  });
});
