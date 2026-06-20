import { getCellWalls, isInside, toIndex, toPosition } from './board';
import type { Board, CellIndex, Direction, Move, RobotColor, RobotState } from './types';

const ROBOT_ORDER: RobotColor[] = ['red', 'blue', 'yellow', 'green', 'black'];
const DIRECTION_ORDER: Direction[] = ['up', 'right', 'down', 'left'];

const DIRECTION_DELTA: Record<Direction, { row: number; col: number }> = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
};

const WALL_BY_DIRECTION = {
  up: 'top',
  right: 'right',
  down: 'bottom',
  left: 'left',
} as const satisfies Record<Direction, keyof ReturnType<typeof getCellWalls>>;

function getNextPosition(
  index: CellIndex,
  direction: Direction,
  board: Board
): CellIndex | null {
  const position = toPosition(index, board);
  const delta = DIRECTION_DELTA[direction];
  const nextRow = position.row + delta.row;
  const nextCol = position.col + delta.col;

  if (!isInside(nextRow, nextCol, board)) {
    return null;
  }

  return toIndex(nextRow, nextCol, board);
}

function hasRobotAt(
  robots: RobotState,
  index: CellIndex,
  exceptRobot?: RobotColor
): boolean {
  return ROBOT_ORDER.some((robot) => robot !== exceptRobot && robots[robot] === index);
}

export function slideRobot(
  board: Board,
  robots: RobotState,
  robot: RobotColor,
  direction: Direction
): Move | null {
  const from = robots[robot];
  let current = from;

  while (true) {
    const walls = getCellWalls(board, current);

    if (walls[WALL_BY_DIRECTION[direction]]) {
      break;
    }

    const next = getNextPosition(current, direction, board);

    if (next === null || hasRobotAt(robots, next, robot)) {
      break;
    }

    current = next;
  }

  if (current === from) {
    return null;
  }

  return {
    robot,
    direction,
    from,
    to: current,
  };
}

export function generateMoves(board: Board, robots: RobotState): Move[] {
  const moves: Move[] = [];

  for (const robot of ROBOT_ORDER) {
    for (const direction of DIRECTION_ORDER) {
      const move = slideRobot(board, robots, robot, direction);

      if (move) {
        moves.push(move);
      }
    }
  }

  return moves;
}

export function applyMove(robots: RobotState, move: Move): RobotState {
  return {
    ...robots,
    [move.robot]: move.to,
  };
}
