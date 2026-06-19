import { describe, expect, it } from 'vitest';
import { createEmptyBoard, toIndex } from './board';
import { getCellsBetweenMove } from './playback';
import type { Move } from './types';

const board = createEmptyBoard(4, 4);

function createMove(from: number, to: number): Move {
  return {
    robot: 'red',
    direction: 'right',
    from,
    to,
  };
}

describe('playback path helpers', () => {
  it('calculates path cells for a same-row move', () => {
    const move = createMove(toIndex(1, 0, board), toIndex(1, 3, board));

    expect(getCellsBetweenMove(board, move)).toEqual([
      toIndex(1, 0, board),
      toIndex(1, 1, board),
      toIndex(1, 2, board),
      toIndex(1, 3, board),
    ]);
  });

  it('calculates path cells for a same-column move', () => {
    const move = createMove(toIndex(0, 2, board), toIndex(3, 2, board));

    expect(getCellsBetweenMove(board, move)).toEqual([
      toIndex(0, 2, board),
      toIndex(1, 2, board),
      toIndex(2, 2, board),
      toIndex(3, 2, board),
    ]);
  });

  it('includes from and to when they are the same cell', () => {
    const move = createMove(toIndex(2, 2, board), toIndex(2, 2, board));

    expect(getCellsBetweenMove(board, move)).toEqual([toIndex(2, 2, board)]);
  });

  it('preserves reverse movement order', () => {
    const move = createMove(toIndex(3, 1, board), toIndex(0, 1, board));

    expect(getCellsBetweenMove(board, move)).toEqual([
      toIndex(3, 1, board),
      toIndex(2, 1, board),
      toIndex(1, 1, board),
      toIndex(0, 1, board),
    ]);
  });

  it('throws for a diagonal move', () => {
    const move = createMove(toIndex(0, 0, board), toIndex(1, 1, board));

    expect(() => getCellsBetweenMove(board, move)).toThrow('same row or column');
  });
});
