import type { Board, CellIndex, CellWalls, Direction, Position } from './types';

const EMPTY_WALLS: CellWalls = {
  top: false,
  right: false,
  bottom: false,
  left: false,
};

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  up: 'down',
  right: 'left',
  down: 'up',
  left: 'right',
};

const DIRECTION_DELTA: Record<Direction, Position> = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
};

const WALL_BY_DIRECTION: Record<Direction, keyof CellWalls> = {
  up: 'top',
  right: 'right',
  down: 'bottom',
  left: 'left',
};

export function toIndex(row: number, col: number, board: Board): CellIndex {
  return row * board.width + col;
}

export function toPosition(index: CellIndex, board: Board): Position {
  return {
    row: Math.floor(index / board.width),
    col: index % board.width,
  };
}

export function isInside(row: number, col: number, board: Board): boolean {
  return row >= 0 && row < board.height && col >= 0 && col < board.width;
}

export function getCellWalls(board: Board, index: CellIndex): CellWalls {
  const walls = board.walls[index];

  if (!walls) {
    throw new RangeError(`Cell index ${index} is outside the board.`);
  }

  return walls;
}

export function hasCornerWalls(board: Board, index: CellIndex): boolean {
  const walls = getCellWalls(board, index);

  return (
    (walls.top && walls.right) ||
    (walls.right && walls.bottom) ||
    (walls.bottom && walls.left) ||
    (walls.left && walls.top)
  );
}

export function createEmptyBoard(width: number, height: number): Board {
  return {
    width,
    height,
    walls: Array.from({ length: width * height }, () => ({ ...EMPTY_WALLS })),
  };
}

export function addWall(board: Board, index: CellIndex, direction: Direction): Board {
  const nextBoard: Board = {
    width: board.width,
    height: board.height,
    walls: board.walls.map((walls) => ({ ...walls })),
  };

  if (index < 0 || index >= nextBoard.walls.length) {
    return nextBoard;
  }

  nextBoard.walls[index][WALL_BY_DIRECTION[direction]] = true;

  const current = toPosition(index, nextBoard);
  const delta = DIRECTION_DELTA[direction];
  const neighborRow = current.row + delta.row;
  const neighborCol = current.col + delta.col;

  if (isInside(neighborRow, neighborCol, nextBoard)) {
    const neighborIndex = toIndex(neighborRow, neighborCol, nextBoard);
    nextBoard.walls[neighborIndex][WALL_BY_DIRECTION[OPPOSITE_DIRECTION[direction]]] = true;
  }

  return nextBoard;
}

export function removeWall(board: Board, index: CellIndex, direction: Direction): Board {
  const nextBoard: Board = {
    width: board.width,
    height: board.height,
    walls: board.walls.map((walls) => ({ ...walls })),
  };

  if (index < 0 || index >= nextBoard.walls.length) {
    return nextBoard;
  }

  nextBoard.walls[index][WALL_BY_DIRECTION[direction]] = false;

  const current = toPosition(index, nextBoard);
  const delta = DIRECTION_DELTA[direction];
  const neighborRow = current.row + delta.row;
  const neighborCol = current.col + delta.col;

  if (isInside(neighborRow, neighborCol, nextBoard)) {
    const neighborIndex = toIndex(neighborRow, neighborCol, nextBoard);
    nextBoard.walls[neighborIndex][WALL_BY_DIRECTION[OPPOSITE_DIRECTION[direction]]] = false;
  }

  return nextBoard;
}

export function toggleWall(board: Board, index: CellIndex, direction: Direction): Board {
  if (index < 0 || index >= board.walls.length) {
    return {
      width: board.width,
      height: board.height,
      walls: board.walls.map((walls) => ({ ...walls })),
    };
  }

  return getCellWalls(board, index)[WALL_BY_DIRECTION[direction]]
    ? removeWall(board, index, direction)
    : addWall(board, index, direction);
}

export function getCenterBlockedCells(board: Board): CellIndex[] {
  if (board.width !== 16 || board.height !== 16) {
    return [];
  }

  return [
    toIndex(7, 7, board),
    toIndex(7, 8, board),
    toIndex(8, 7, board),
    toIndex(8, 8, board),
  ];
}

export function isCenterBlockedCell(board: Board, cell: CellIndex): boolean {
  return getCenterBlockedCells(board).includes(cell);
}

export function addCenterBlock(board: Board): Board {
  let nextBoard = board;

  for (const cell of getCenterBlockedCells(board)) {
    nextBoard = addWall(nextBoard, cell, 'up');
    nextBoard = addWall(nextBoard, cell, 'right');
    nextBoard = addWall(nextBoard, cell, 'down');
    nextBoard = addWall(nextBoard, cell, 'left');
  }

  return nextBoard;
}
