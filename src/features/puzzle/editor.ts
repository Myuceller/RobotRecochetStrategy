import { hasCornerWalls, isCenterBlockedCell, isInside, toPosition, toggleWall } from './board';
import type { Board, CellIndex, Direction, Position, PuzzleState, RobotColor } from './types';

const DIRECTION_DELTA: Record<Direction, Position> = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
};

function getRobotCells(puzzle: PuzzleState, exceptRobot?: RobotColor): CellIndex[] {
  return Object.entries(puzzle.robots)
    .filter(([robot]) => robot !== exceptRobot)
    .map(([, cell]) => cell);
}

function hasRobotOnCell(
  puzzle: PuzzleState,
  cell: CellIndex,
  exceptRobot?: RobotColor
): boolean {
  return getRobotCells(puzzle, exceptRobot).includes(cell);
}

export function canPlaceRobot(
  board: Board,
  puzzle: PuzzleState,
  robot: RobotColor,
  cell: CellIndex
): boolean {
  return !isCenterBlockedCell(board, cell) && !hasRobotOnCell(puzzle, cell, robot);
}

export function canPlaceTarget(
  board: Board,
  puzzle: PuzzleState,
  cell: CellIndex
): boolean {
  return !isCenterBlockedCell(board, cell) && !hasRobotOnCell(puzzle, cell) && hasCornerWalls(board, cell);
}

export function moveRobotInPuzzle(
  board: Board,
  puzzle: PuzzleState,
  robot: RobotColor,
  cell: CellIndex
): PuzzleState {
  if (!canPlaceRobot(board, puzzle, robot, cell)) {
    return puzzle;
  }

  return {
    ...puzzle,
    robots: {
      ...puzzle.robots,
      [robot]: cell,
    },
  };
}

export function setTargetCellInPuzzle(
  board: Board,
  puzzle: PuzzleState,
  cell: CellIndex
): PuzzleState {
  if (!canPlaceTarget(board, puzzle, cell)) {
    return puzzle;
  }

  return {
    ...puzzle,
    targetCell: cell,
  };
}

export function setTargetRobotInPuzzle(
  puzzle: PuzzleState,
  robot: RobotColor
): PuzzleState {
  return {
    ...puzzle,
    targetRobot: robot,
  };
}

export function canToggleWall(
  board: Board,
  cell: CellIndex,
  direction: Direction
): boolean {
  if (cell < 0 || cell >= board.walls.length || isCenterBlockedCell(board, cell)) {
    return false;
  }

  const current = toPosition(cell, board);
  const delta = DIRECTION_DELTA[direction];
  const neighborRow = current.row + delta.row;
  const neighborCol = current.col + delta.col;

  if (!isInside(neighborRow, neighborCol, board)) {
    return false;
  }

  const neighborCell = neighborRow * board.width + neighborCol;

  return !isCenterBlockedCell(board, neighborCell);
}

export function toggleWallInBoard(
  board: Board,
  cell: CellIndex,
  direction: Direction
): Board {
  if (!canToggleWall(board, cell, direction)) {
    return board;
  }

  return toggleWall(board, cell, direction);
}
