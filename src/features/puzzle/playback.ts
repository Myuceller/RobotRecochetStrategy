import { toIndex, toPosition } from './board';
import type { Board, CellIndex, Move } from './types';

export type MovePath = {
  move: Move;
  cells: CellIndex[];
  from: CellIndex;
  to: CellIndex;
};

export function getCellsBetweenMove(board: Board, move: Move): CellIndex[] {
  const from = toPosition(move.from, board);
  const to = toPosition(move.to, board);

  if (move.from === move.to) {
    return [move.from];
  }

  if (from.row !== to.row && from.col !== to.col) {
    throw new Error('Move path must stay in the same row or column.');
  }

  const cells: CellIndex[] = [];

  if (from.row === to.row) {
    const step = from.col <= to.col ? 1 : -1;

    for (let col = from.col; col !== to.col + step; col += step) {
      cells.push(toIndex(from.row, col, board));
    }

    return cells;
  }

  const step = from.row <= to.row ? 1 : -1;

  for (let row = from.row; row !== to.row + step; row += step) {
    cells.push(toIndex(row, from.col, board));
  }

  return cells;
}

export function getMovePath(board: Board, move: Move): MovePath {
  return {
    move,
    cells: getCellsBetweenMove(board, move),
    from: move.from,
    to: move.to,
  };
}
