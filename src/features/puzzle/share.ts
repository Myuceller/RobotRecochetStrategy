import { getCenterBlockedCells, hasCornerWalls, isCenterBlockedCell } from './board';
import type { Board, CellIndex, CellWalls, PuzzleState, RobotColor, TargetRobotColor } from './types';

export type ExportedPuzzleFormatVersion = 1;

export type ExportedPuzzle = {
  version: ExportedPuzzleFormatVersion;
  app: 'sliding-robot-lab';
  board: Board;
  puzzle: PuzzleState;
  meta?: {
    title?: string;
    createdAt?: string;
    source?: 'sample' | 'random' | 'custom';
  };
};

const ROBOT_COLORS: RobotColor[] = ['red', 'blue', 'yellow', 'green', 'black'];
const TARGET_ROBOT_COLORS: TargetRobotColor[] = ['red', 'blue', 'yellow', 'green'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function validateWall(value: unknown, index: number): CellWalls {
  assert(isRecord(value), `board.walls[${index}] must be an object.`);

  for (const key of ['top', 'right', 'bottom', 'left'] as const) {
    assert(typeof value[key] === 'boolean', `board.walls[${index}].${key} must be boolean.`);
  }

  return {
    top: Boolean(value.top),
    right: Boolean(value.right),
    bottom: Boolean(value.bottom),
    left: Boolean(value.left),
  };
}

function validateBoard(value: unknown): Board {
  assert(isRecord(value), 'board must be an object.');
  assert(typeof value.width === 'number', 'board.width must be a number.');
  assert(typeof value.height === 'number', 'board.height must be a number.');
  assert(Number.isInteger(value.width) && value.width > 0, 'board.width must be a positive integer.');
  assert(Number.isInteger(value.height) && value.height > 0, 'board.height must be a positive integer.');
  assert(Array.isArray(value.walls), 'board.walls must be an array.');
  assert(
    value.walls.length === value.width * value.height,
    'board.walls length must equal board.width * board.height.'
  );

  return {
    width: value.width,
    height: value.height,
    walls: value.walls.map(validateWall),
  };
}

function validateCellIndex(cell: unknown, board: Board, label: string): CellIndex {
  assert(typeof cell === 'number' && Number.isInteger(cell), `${label} must be an integer.`);
  assert(cell >= 0 && cell < board.walls.length, `${label} must be inside the board.`);

  return cell;
}

function validateTargetId(value: unknown): number {
  assert(typeof value === 'number' && Number.isInteger(value), 'puzzle.targetId must be an integer.');
  assert(value >= 1 && value <= 16, 'puzzle.targetId must be between 1 and 16.');

  return value;
}

function validatePuzzle(value: unknown, board: Board): PuzzleState {
  assert(isRecord(value), 'puzzle must be an object.');
  assert(isRecord(value.robots), 'puzzle.robots must be an object.');

  const robotData = value.robots;
  const robots = Object.fromEntries(
    ROBOT_COLORS.map((robot) => [
      robot,
      validateCellIndex(robotData[robot], board, `puzzle.robots.${robot}`),
    ])
  ) as PuzzleState['robots'];
  const robotCells = Object.values(robots);

  assert(new Set(robotCells).size === ROBOT_COLORS.length, 'robot positions must be distinct.');
  assert(
    TARGET_ROBOT_COLORS.includes(value.targetRobot as TargetRobotColor),
    'puzzle.targetRobot must be red, blue, yellow, or green.'
  );

  const targetCell = validateCellIndex(value.targetCell, board, 'puzzle.targetCell');
  const targetId =
    value.targetId === undefined
      ? undefined
      : validateTargetId(value.targetId);

  assert(!robotCells.includes(targetCell), 'puzzle.targetCell must not overlap a robot position.');
  assert(hasCornerWalls(board, targetCell), 'puzzle.targetCell must be inside a corner wall target cell.');

  if (getCenterBlockedCells(board).length > 0) {
    for (const [robot, cell] of Object.entries(robots)) {
      assert(!isCenterBlockedCell(board, cell), `puzzle.robots.${robot} must not be in the center block.`);
    }

    assert(!isCenterBlockedCell(board, targetCell), 'puzzle.targetCell must not be in the center block.');
  }

  return {
    robots,
    targetRobot: value.targetRobot as TargetRobotColor,
    targetCell,
    ...(targetId === undefined ? {} : { targetId }),
  };
}

function validateMeta(value: unknown): ExportedPuzzle['meta'] {
  if (value === undefined) {
    return undefined;
  }

  assert(isRecord(value), 'meta must be an object.');

  const meta: ExportedPuzzle['meta'] = {};

  if (value.title !== undefined) {
    assert(typeof value.title === 'string', 'meta.title must be a string.');
    meta.title = value.title;
  }

  if (value.createdAt !== undefined) {
    assert(typeof value.createdAt === 'string', 'meta.createdAt must be a string.');
    meta.createdAt = value.createdAt;
  }

  if (value.source !== undefined) {
    assert(
      value.source === 'sample' || value.source === 'random' || value.source === 'custom',
      'meta.source must be sample, random, or custom.'
    );
    meta.source = value.source;
  }

  return meta;
}

export function validateExportedPuzzle(data: unknown): ExportedPuzzle {
  assert(isRecord(data), 'exported puzzle must be an object.');
  assert(data.version === 1, 'exported puzzle version must be 1.');
  assert(data.app === 'sliding-robot-lab', 'exported puzzle app must be sliding-robot-lab.');

  const board = validateBoard(data.board);
  const puzzle = validatePuzzle(data.puzzle, board);
  const meta = validateMeta(data.meta);

  return {
    version: 1,
    app: 'sliding-robot-lab',
    board,
    puzzle,
    ...(meta ? { meta } : {}),
  };
}

export function parsePuzzleFromJson(json: string): ExportedPuzzle {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Import JSON is not valid JSON.');
  }

  return validateExportedPuzzle(parsed);
}

export function exportPuzzleToJson(
  board: Board,
  puzzle: PuzzleState,
  meta?: ExportedPuzzle['meta']
): string {
  return JSON.stringify(
    {
      version: 1,
      app: 'sliding-robot-lab',
      board,
      puzzle,
      meta: {
        ...meta,
        createdAt: meta?.createdAt ?? new Date().toISOString(),
      },
    } satisfies ExportedPuzzle,
    null,
    2
  );
}
