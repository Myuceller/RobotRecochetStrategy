import { describe, expect, it } from 'vitest';
import { addCenterBlock, addWall, createEmptyBoard, getCellWalls, toIndex } from './board';
import {
  canToggleWall,
  canPlaceRobot,
  canPlaceTarget,
  moveRobotInPuzzle,
  setTargetCellInPuzzle,
  setTargetRobotInPuzzle,
  toggleWallInBoard,
} from './editor';
import type { PuzzleState } from './types';

let board = addCenterBlock(createEmptyBoard(16, 16));
board = addWall(board, toIndex(5, 5, board), 'right');
board = addWall(board, toIndex(5, 5, board), 'down');

const puzzle: PuzzleState = {
  robots: {
    red: toIndex(0, 0, board),
    blue: toIndex(0, 1, board),
    yellow: toIndex(2, 2, board),
    green: toIndex(3, 3, board),
  },
  targetRobot: 'red',
  targetCell: toIndex(4, 4, board),
};

describe('puzzle editor helpers', () => {
  it('does not allow placing a robot on a center blocked cell', () => {
    expect(canPlaceRobot(board, puzzle, 'red', toIndex(7, 7, board))).toBe(false);
  });

  it('does not allow placing a target on a center blocked cell', () => {
    expect(canPlaceTarget(board, puzzle, toIndex(8, 8, board))).toBe(false);
  });

  it('does not allow moving a robot onto another robot', () => {
    expect(canPlaceRobot(board, puzzle, 'red', puzzle.robots.blue)).toBe(false);
  });

  it('keeps robot positions distinct after moving a robot', () => {
    const updated = moveRobotInPuzzle(board, puzzle, 'red', toIndex(5, 5, board));

    expect(new Set(Object.values(updated.robots)).size).toBe(4);
    expect(updated.robots.red).toBe(toIndex(5, 5, board));
  });

  it('does not allow setting the target on a robot start cell', () => {
    expect(canPlaceTarget(board, puzzle, puzzle.robots.red)).toBe(false);
  });

  it('does not allow setting the target on a plain cell without corner walls', () => {
    expect(canPlaceTarget(board, puzzle, toIndex(4, 4, board))).toBe(false);
  });

  it('moves robots immutably', () => {
    const updated = moveRobotInPuzzle(board, puzzle, 'red', toIndex(5, 5, board));

    expect(updated).not.toBe(puzzle);
    expect(updated.robots).not.toBe(puzzle.robots);
    expect(puzzle.robots.red).toBe(toIndex(0, 0, board));
  });

  it('sets target cells immutably', () => {
    const updated = setTargetCellInPuzzle(board, puzzle, toIndex(5, 5, board));

    expect(updated).not.toBe(puzzle);
    expect(updated.targetCell).toBe(toIndex(5, 5, board));
    expect(puzzle.targetCell).toBe(toIndex(4, 4, board));
  });

  it('sets target robot without changing other puzzle data', () => {
    const updated = setTargetRobotInPuzzle(puzzle, 'blue');

    expect(updated).toEqual({
      ...puzzle,
      targetRobot: 'blue',
    });
  });

  it('does not allow toggling walls on center blocked cells', () => {
    expect(canToggleWall(board, toIndex(7, 7, board), 'right')).toBe(false);
  });

  it('does not allow toggling walls that enter the center block', () => {
    expect(canToggleWall(board, toIndex(7, 6, board), 'right')).toBe(false);
  });

  it('does not allow toggling outside board boundary walls', () => {
    expect(canToggleWall(board, toIndex(0, 0, board), 'up')).toBe(false);
    expect(canToggleWall(board, toIndex(0, 0, board), 'left')).toBe(false);
  });

  it('allows toggling internal walls', () => {
    expect(canToggleWall(board, toIndex(2, 2, board), 'right')).toBe(true);
  });

  it('toggles walls immutably and keeps wall array length stable', () => {
    const cell = toIndex(2, 2, board);
    const neighbor = toIndex(2, 3, board);
    const updated = toggleWallInBoard(board, cell, 'right');

    expect(updated).not.toBe(board);
    expect(updated.walls).toHaveLength(board.walls.length);
    expect(getCellWalls(updated, cell).right).toBe(true);
    expect(getCellWalls(updated, neighbor).left).toBe(true);
    expect(getCellWalls(board, cell).right).toBe(false);
  });

  it('returns the same board when a protected wall is toggled', () => {
    const updated = toggleWallInBoard(board, toIndex(7, 6, board), 'right');

    expect(updated).toBe(board);
  });
});
