import { addWall, createEmptyBoard, getCenterBlockedCells, hasCornerWalls, toIndex } from './board';
import type { Board, CellIndex, Direction, PuzzleState, RobotColor } from './types';

type WallSpecColor = RobotColor | 'rainbow' | string;

export type WallSpecTarget = {
  x: number;
  y: number;
  color: WallSpecColor;
  shape: string;
};

export type WallSpec = {
  size: number;
  outerWalls?: boolean;
  centerBlock?: Array<[number, number]>;
  vWalls?: Array<[number, number]>;
  hWalls?: Array<[number, number]>;
  targets?: WallSpecTarget[];
};

export type WallSpecImportResult = {
  board: Board;
  puzzle: PuzzleState;
  selectedTarget?: WallSpecTarget;
};

const ROBOT_COLORS: RobotColor[] = ['red', 'blue', 'yellow', 'green'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCoordinate(value: unknown, label: string): [number, number] {
  assert(Array.isArray(value), `${label} must be a coordinate pair.`);
  assert(value.length === 2, `${label} must contain exactly two numbers.`);
  assert(Number.isInteger(value[0]) && Number.isInteger(value[1]), `${label} must contain integers.`);

  return [value[0], value[1]];
}

function parseCoordinateList(value: unknown, label: string): Array<[number, number]> {
  if (value === undefined) {
    return [];
  }

  assert(Array.isArray(value), `${label} must be an array.`);

  return value.map((item, index) => parseCoordinate(item, `${label}[${index}]`));
}

function parseTargets(value: unknown): WallSpecTarget[] {
  if (value === undefined) {
    return [];
  }

  assert(Array.isArray(value), 'targets must be an array.');

  return value.map((target, index) => {
    assert(isRecord(target), `targets[${index}] must be an object.`);
    assert(Number.isInteger(target.x), `targets[${index}].x must be an integer.`);
    assert(Number.isInteger(target.y), `targets[${index}].y must be an integer.`);
    assert(typeof target.color === 'string', `targets[${index}].color must be a string.`);
    assert(typeof target.shape === 'string', `targets[${index}].shape must be a string.`);

    return {
      x: Number(target.x),
      y: Number(target.y),
      color: target.color,
      shape: target.shape,
    };
  });
}

export function validateWallSpec(data: unknown): WallSpec {
  assert(isRecord(data), 'wallSpec must be an object.');
  const size = data.size;

  assert(Number.isInteger(size) && Number(size) > 0, 'wallSpec.size must be a positive integer.');

  if (data.outerWalls !== undefined) {
    assert(typeof data.outerWalls === 'boolean', 'wallSpec.outerWalls must be boolean.');
  }

  return {
    size: Number(size),
    outerWalls: data.outerWalls,
    centerBlock: parseCoordinateList(data.centerBlock, 'centerBlock'),
    vWalls: parseCoordinateList(data.vWalls, 'vWalls'),
    hWalls: parseCoordinateList(data.hWalls, 'hWalls'),
    targets: parseTargets(data.targets),
  };
}

export function parseWallSpecFromJson(json: string): WallSpec {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Wall spec JSON is not valid JSON.');
  }

  return validateWallSpec(parsed);
}

function assertInsideCell(x: number, y: number, size: number, label: string): void {
  assert(x >= 0 && x < size && y >= 0 && y < size, `${label} must be inside the ${size}x${size} board.`);
}

function addOuterWalls(board: Board): Board {
  let nextBoard = board;

  for (let col = 0; col < board.width; col += 1) {
    nextBoard = addWall(nextBoard, toIndex(0, col, nextBoard), 'up');
    nextBoard = addWall(nextBoard, toIndex(board.height - 1, col, nextBoard), 'down');
  }

  for (let row = 0; row < board.height; row += 1) {
    nextBoard = addWall(nextBoard, toIndex(row, 0, nextBoard), 'left');
    nextBoard = addWall(nextBoard, toIndex(row, board.width - 1, nextBoard), 'right');
  }

  return nextBoard;
}

function addBoundaryWall(board: Board, x: number, y: number, direction: Direction): Board {
  assertInsideCell(x, y, board.width, `${direction} wall coordinate`);

  return addWall(board, toIndex(y, x, board), direction);
}

export function wallSpecToBoard(spec: WallSpec): Board {
  let board = createEmptyBoard(spec.size, spec.size);

  if (spec.outerWalls) {
    board = addOuterWalls(board);
  }

  for (const [x, y] of spec.vWalls ?? []) {
    assert(x >= 0 && x <= spec.size, `vWall x=${x} must be between 0 and ${spec.size}.`);
    assert(y >= 0 && y < spec.size, `vWall y=${y} must be inside the board.`);

    if (x === 0) {
      board = addBoundaryWall(board, 0, y, 'left');
    } else if (x === spec.size) {
      board = addBoundaryWall(board, spec.size - 1, y, 'right');
    } else {
      board = addBoundaryWall(board, x, y, 'left');
    }
  }

  for (const [x, y] of spec.hWalls ?? []) {
    assert(x >= 0 && x < spec.size, `hWall x=${x} must be inside the board.`);
    assert(y >= 0 && y <= spec.size, `hWall y=${y} must be between 0 and ${spec.size}.`);

    if (y === 0) {
      board = addBoundaryWall(board, x, 0, 'up');
    } else if (y === spec.size) {
      board = addBoundaryWall(board, x, spec.size - 1, 'down');
    } else {
      board = addBoundaryWall(board, x, y, 'up');
    }
  }

  for (const [x, y] of spec.centerBlock ?? []) {
    assertInsideCell(x, y, spec.size, 'centerBlock coordinate');
    const cell = toIndex(y, x, board);

    board = addWall(board, cell, 'up');
    board = addWall(board, cell, 'right');
    board = addWall(board, cell, 'down');
    board = addWall(board, cell, 'left');
  }

  return board;
}

function isRobotColor(value: string): value is RobotColor {
  return ROBOT_COLORS.includes(value as RobotColor);
}

function getFallbackRobots(board: Board, targetCell: CellIndex): PuzzleState['robots'] {
  const blockedCells = new Set(getCenterBlockedCells(board));
  const cells = Array.from({ length: board.width * board.height }, (_, cell) => cell).filter(
    (cell) => cell !== targetCell && !blockedCells.has(cell)
  );

  assert(cells.length >= ROBOT_COLORS.length, 'Not enough cells to place robots.');

  return {
    red: cells[0],
    blue: cells[1],
    yellow: cells[2],
    green: cells[3],
  };
}

function canReuseRobots(board: Board, robots: PuzzleState['robots'], targetCell: CellIndex): boolean {
  const blockedCells = new Set(getCenterBlockedCells(board));
  const cells = Object.values(robots);

  return (
    new Set(cells).size === ROBOT_COLORS.length &&
    cells.every((cell) => cell >= 0 && cell < board.walls.length && cell !== targetCell && !blockedCells.has(cell))
  );
}

export function createPuzzleFromWallSpec(
  spec: WallSpec,
  board: Board,
  previousPuzzle?: PuzzleState
): WallSpecImportResult {
  const target = (spec.targets ?? []).find((item) => {
    if (item.x < 0 || item.x >= board.width || item.y < 0 || item.y >= board.height) {
      return false;
    }

    return hasCornerWalls(board, toIndex(item.y, item.x, board));
  });

  assert(target !== undefined, 'wallSpec must include at least one target inside a corner wall cell.');

  const targetCell = toIndex(target.y, target.x, board);
  const targetRobot = isRobotColor(target.color)
    ? target.color
    : previousPuzzle?.targetRobot ?? 'red';
  const robots =
    previousPuzzle && canReuseRobots(board, previousPuzzle.robots, targetCell)
      ? previousPuzzle.robots
      : getFallbackRobots(board, targetCell);

  return {
    board,
    puzzle: {
      robots,
      targetRobot,
      targetCell,
    },
    selectedTarget: target,
  };
}

export function parseWallSpecImportFromJson(
  json: string,
  previousPuzzle?: PuzzleState
): WallSpecImportResult {
  const spec = parseWallSpecFromJson(json);
  const board = wallSpecToBoard(spec);

  return createPuzzleFromWallSpec(spec, board, previousPuzzle);
}
