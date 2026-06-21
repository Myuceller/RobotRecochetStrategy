import { addCenterBlock, addWall, createEmptyBoard, isInside, toIndex, toPosition } from './board';
import type { Board, CellIndex, CellWalls, Direction } from './types';
import type {
  CornerWallOrientation,
  ModuleEdge,
  ModuleEdgeStopper,
  ModuleCellIndex,
  ModuleCornerWall,
  ModulePlacement,
  ModuleSlot,
  ModularBoardConfig,
  Rotation,
} from './moduleTypes';

const MODULE_SIZE = 8;
const BOARD_SIZE = 16;
const REQUIRED_SLOTS: ModuleSlot[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

const WALL_DIRECTIONS: Array<keyof CellWalls> = ['top', 'right', 'bottom', 'left'];

const WALL_TO_DIRECTION: Record<keyof CellWalls, Direction> = {
  top: 'up',
  right: 'right',
  bottom: 'down',
  left: 'left',
};

const DIRECTION_TO_WALL: Record<Direction, keyof CellWalls> = {
  up: 'top',
  right: 'right',
  down: 'bottom',
  left: 'left',
};

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  up: 'down',
  right: 'left',
  down: 'up',
  left: 'right',
};

const DIRECTION_DELTA: Record<Direction, { row: number; col: number }> = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
};

const CORNER_DIRECTIONS: Record<CornerWallOrientation, [Direction, Direction]> = {
  topLeft: ['up', 'left'],
  topRight: ['up', 'right'],
  bottomLeft: ['down', 'left'],
  bottomRight: ['down', 'right'],
};

export function rotateModuleIndex(
  index: ModuleCellIndex,
  rotation: Rotation,
  size = MODULE_SIZE
): ModuleCellIndex {
  const row = Math.floor(index / size);
  const col = index % size;

  switch (rotation) {
    case 0:
      return row * size + col;
    case 90:
      return col * size + (size - 1 - row);
    case 180:
      return (size - 1 - row) * size + (size - 1 - col);
    case 270:
      return (size - 1 - col) * size + row;
  }
}

export function rotateWalls(walls: CellWalls, rotation: Rotation): CellWalls {
  switch (rotation) {
    case 0:
      return { ...walls };
    case 90:
      return {
        top: walls.left,
        right: walls.top,
        bottom: walls.right,
        left: walls.bottom,
      };
    case 180:
      return {
        top: walls.bottom,
        right: walls.left,
        bottom: walls.top,
        left: walls.right,
      };
    case 270:
      return {
        top: walls.right,
        right: walls.bottom,
        bottom: walls.left,
        left: walls.top,
      };
  }
}

export function rotateCornerWall(
  cornerWall: ModuleCornerWall,
  rotation: Rotation,
  size = MODULE_SIZE
): ModuleCornerWall {
  const orientationByRotation: Record<Rotation, Record<CornerWallOrientation, CornerWallOrientation>> = {
    0: {
      topLeft: 'topLeft',
      topRight: 'topRight',
      bottomRight: 'bottomRight',
      bottomLeft: 'bottomLeft',
    },
    90: {
      topLeft: 'topRight',
      topRight: 'bottomRight',
      bottomRight: 'bottomLeft',
      bottomLeft: 'topLeft',
    },
    180: {
      topLeft: 'bottomRight',
      topRight: 'bottomLeft',
      bottomRight: 'topLeft',
      bottomLeft: 'topRight',
    },
    270: {
      topLeft: 'bottomLeft',
      bottomLeft: 'bottomRight',
      bottomRight: 'topRight',
      topRight: 'topLeft',
    },
  };

  return {
    cell: rotateModuleIndex(cornerWall.cell, rotation, size),
    orientation: orientationByRotation[rotation][cornerWall.orientation],
  };
}

export function rotateEdgeStopper(
  stopper: ModuleEdgeStopper,
  rotation: Rotation,
  size = MODULE_SIZE
): ModuleEdgeStopper {
  assertValidEdgeStopper(stopper, size);

  const edgeByRotation: Record<Rotation, Record<ModuleEdge, ModuleEdge>> = {
    0: {
      top: 'top',
      right: 'right',
      bottom: 'bottom',
      left: 'left',
    },
    90: {
      top: 'right',
      right: 'bottom',
      bottom: 'left',
      left: 'top',
    },
    180: {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    },
    270: {
      top: 'left',
      right: 'top',
      bottom: 'right',
      left: 'bottom',
    },
  };
  const shouldFlipOffset =
    rotation === 180 ||
    (rotation === 90 && (stopper.edge === 'right' || stopper.edge === 'left')) ||
    (rotation === 270 && (stopper.edge === 'top' || stopper.edge === 'bottom'));
  const offset = shouldFlipOffset ? size - 2 - stopper.offset : stopper.offset;

  return {
    edge: edgeByRotation[rotation][stopper.edge],
    offset,
  };
}

export function getSlotOffset(slot: ModuleSlot): { rowOffset: number; colOffset: number } {
  switch (slot) {
    case 'topLeft':
      return { rowOffset: 0, colOffset: 0 };
    case 'topRight':
      return { rowOffset: 0, colOffset: MODULE_SIZE };
    case 'bottomLeft':
      return { rowOffset: MODULE_SIZE, colOffset: 0 };
    case 'bottomRight':
      return { rowOffset: MODULE_SIZE, colOffset: MODULE_SIZE };
  }
}

export function moduleIndexToGlobalIndex(
  moduleIndex: ModuleCellIndex,
  slot: ModuleSlot,
  rotation: Rotation,
  board: Board
): CellIndex {
  const rotatedIndex = rotateModuleIndex(moduleIndex, rotation, MODULE_SIZE);
  const localRow = Math.floor(rotatedIndex / MODULE_SIZE);
  const localCol = rotatedIndex % MODULE_SIZE;
  const { rowOffset, colOffset } = getSlotOffset(slot);

  return toIndex(rowOffset + localRow, colOffset + localCol, board);
}

function moduleIndexToGlobalIndexWithoutRotation(
  moduleIndex: ModuleCellIndex,
  slot: ModuleSlot,
  board: Board
): CellIndex {
  const localRow = Math.floor(moduleIndex / MODULE_SIZE);
  const localCol = moduleIndex % MODULE_SIZE;
  const { rowOffset, colOffset } = getSlotOffset(slot);

  return toIndex(rowOffset + localRow, colOffset + localCol, board);
}

function createEmptyWalls(size: number): CellWalls[] {
  return Array.from({ length: size * size }, () => ({
    top: false,
    right: false,
    bottom: false,
    left: false,
  }));
}

function addLocalWall(
  walls: CellWalls[],
  index: ModuleCellIndex,
  direction: Direction,
  size: number
): CellWalls[] {
  const nextWalls = walls.map((cellWalls) => ({ ...cellWalls }));

  if (index < 0 || index >= nextWalls.length) {
    return nextWalls;
  }

  const board = {
    width: size,
    height: size,
    walls: nextWalls,
  };
  const position = toPosition(index, board);
  const delta = DIRECTION_DELTA[direction];
  const neighborRow = position.row + delta.row;
  const neighborCol = position.col + delta.col;

  nextWalls[index][DIRECTION_TO_WALL[direction]] = true;

  if (isInside(neighborRow, neighborCol, board)) {
    const neighborIndex = toIndex(neighborRow, neighborCol, board);
    nextWalls[neighborIndex][DIRECTION_TO_WALL[OPPOSITE_DIRECTION[direction]]] = true;
  }

  return nextWalls;
}

function assertValidEdgeStopper(stopper: ModuleEdgeStopper, size: number): void {
  const minOffset = 1;
  const maxOffset = size - 3;

  if (!Number.isInteger(stopper.offset) || stopper.offset < minOffset || stopper.offset > maxOffset) {
    throw new Error(
      `Edge stopper offset ${stopper.offset} is outside the valid range ${minOffset}..${maxOffset}.`
    );
  }
}

function getEdgeStopperCell(stopper: ModuleEdgeStopper, size: number): ModuleCellIndex {
  switch (stopper.edge) {
    case 'left':
      return stopper.offset * size;
    case 'right':
      return stopper.offset * size + (size - 1);
    case 'top':
      return stopper.offset;
    case 'bottom':
      return (size - 1) * size + stopper.offset;
  }
}

export function addCornerWallToModuleWalls(
  walls: CellWalls[],
  cornerWall: ModuleCornerWall,
  size = MODULE_SIZE
): CellWalls[] {
  let nextWalls = walls.map((cellWalls) => ({ ...cellWalls }));

  for (const direction of CORNER_DIRECTIONS[cornerWall.orientation]) {
    nextWalls = addLocalWall(nextWalls, cornerWall.cell, direction, size);
  }

  return nextWalls;
}

export function createModuleWallsFromCornerWalls(
  cornerWalls: ModuleCornerWall[],
  size = MODULE_SIZE
): CellWalls[] {
  let walls = createEmptyWalls(size);

  for (const cornerWall of cornerWalls) {
    walls = addCornerWallToModuleWalls(walls, cornerWall, size);
  }

  return walls;
}

export function addEdgeStopperToModuleWalls(
  walls: CellWalls[],
  stopper: ModuleEdgeStopper,
  size = MODULE_SIZE
): CellWalls[] {
  assertValidEdgeStopper(stopper, size);

  switch (stopper.edge) {
    case 'left':
    case 'right':
      return addLocalWall(walls, getEdgeStopperCell(stopper, size), 'down', size);
    case 'top':
    case 'bottom':
      return addLocalWall(walls, getEdgeStopperCell(stopper, size), 'right', size);
  }
}

export function createModuleWallsFromEdgeStoppers(
  stoppers: ModuleEdgeStopper[],
  size = MODULE_SIZE
): CellWalls[] {
  let walls = createEmptyWalls(size);

  for (const stopper of stoppers) {
    walls = addEdgeStopperToModuleWalls(walls, stopper, size);
  }

  return walls;
}

export function createModuleWallsFromMetadata(
  cornerWalls: ModuleCornerWall[],
  edgeStoppers: ModuleEdgeStopper[],
  size = MODULE_SIZE
): CellWalls[] {
  let walls = createModuleWallsFromCornerWalls(cornerWalls, size);

  for (const stopper of edgeStoppers) {
    walls = addEdgeStopperToModuleWalls(walls, stopper, size);
  }

  return walls;
}

function getManhattanDistance(first: ModuleCellIndex, second: ModuleCellIndex, size: number): number {
  const firstRow = Math.floor(first / size);
  const firstCol = first % size;
  const secondRow = Math.floor(second / size);
  const secondCol = second % size;

  return Math.abs(firstRow - secondRow) + Math.abs(firstCol - secondCol);
}

function assertEdgeStoppersFarFromCornerWalls(
  cornerWalls: ModuleCornerWall[] | undefined,
  stoppers: ModuleEdgeStopper[],
  size: number
): void {
  if (!cornerWalls) {
    return;
  }

  for (const stopper of stoppers) {
    const stopperCell = getEdgeStopperCell(stopper, size);

    for (const cornerWall of cornerWalls) {
      if (getManhattanDistance(stopperCell, cornerWall.cell, size) < 2) {
        throw new Error('Edge stoppers must be at least 2 cells away from corner walls.');
      }
    }
  }
}

function assertValidPlacements(placements: ModulePlacement[]): void {
  if (placements.length !== REQUIRED_SLOTS.length) {
    throw new Error('Modular board requires exactly four module placements.');
  }

  const seenSlots = new Set<ModuleSlot>();

  for (const placement of placements) {
    if (seenSlots.has(placement.slot)) {
      throw new Error(`Duplicate module slot: ${placement.slot}`);
    }

    seenSlots.add(placement.slot);

    if (placement.module.size !== MODULE_SIZE) {
      throw new Error(`Module ${placement.module.id} must have size 8.`);
    }

    if (placement.module.walls.length !== MODULE_SIZE * MODULE_SIZE) {
      throw new Error(`Module ${placement.module.id} must contain 64 wall records.`);
    }

    if (placement.module.cornerWalls && placement.module.cornerWalls.length !== 4) {
      throw new Error(`Module ${placement.module.id} must contain exactly 4 corner walls.`);
    }

    if (placement.module.edgeStoppers) {
      if (placement.module.edgeStoppers.length !== 2) {
        throw new Error(`Module ${placement.module.id} must contain exactly 2 edge stoppers.`);
      }

      const horizontalCount = placement.module.edgeStoppers.filter(
        (stopper) => stopper.edge === 'left' || stopper.edge === 'right'
      ).length;
      const verticalCount = placement.module.edgeStoppers.filter(
        (stopper) => stopper.edge === 'top' || stopper.edge === 'bottom'
      );

      if (horizontalCount !== 1 || verticalCount.length !== 1) {
        throw new Error(
          `Module ${placement.module.id} must contain one horizontal and one vertical edge stopper.`
        );
      }

      for (const stopper of placement.module.edgeStoppers) {
        assertValidEdgeStopper(stopper, MODULE_SIZE);
      }

      assertEdgeStoppersFarFromCornerWalls(
        placement.module.cornerWalls,
        placement.module.edgeStoppers,
        MODULE_SIZE
      );
    }
  }

  for (const slot of REQUIRED_SLOTS) {
    if (!seenSlots.has(slot)) {
      throw new Error(`Missing module slot: ${slot}`);
    }
  }
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

function addModuleWalls(board: Board, placement: ModulePlacement): Board {
  let nextBoard = board;

  placement.module.walls.forEach((walls, moduleIndex) => {
    const globalIndex = moduleIndexToGlobalIndex(
      moduleIndex,
      placement.slot,
      placement.rotation,
      nextBoard
    );
    const rotatedWalls = rotateWalls(walls, placement.rotation);

    for (const wall of WALL_DIRECTIONS) {
      if (rotatedWalls[wall]) {
        nextBoard = addWall(nextBoard, globalIndex, WALL_TO_DIRECTION[wall]);
      }
    }
  });

  return nextBoard;
}

function isOutsideEdgeForSlot(slot: ModuleSlot, edge: ModuleEdge): boolean {
  switch (slot) {
    case 'topLeft':
      return edge === 'top' || edge === 'left';
    case 'topRight':
      return edge === 'top' || edge === 'right';
    case 'bottomLeft':
      return edge === 'bottom' || edge === 'left';
    case 'bottomRight':
      return edge === 'bottom' || edge === 'right';
  }
}

function addPlacementEdgeStoppers(board: Board, placement: ModulePlacement): Board {
  let nextBoard = board;

  for (const stopper of placement.module.edgeStoppers ?? []) {
    const rotatedStopper = rotateEdgeStopper(stopper, placement.rotation);

    if (!isOutsideEdgeForSlot(placement.slot, rotatedStopper.edge)) {
      continue;
    }

    const stopperWalls = createModuleWallsFromEdgeStoppers([rotatedStopper]);

    stopperWalls.forEach((walls, moduleIndex) => {
      const globalIndex = moduleIndexToGlobalIndexWithoutRotation(moduleIndex, placement.slot, nextBoard);

      for (const wall of WALL_DIRECTIONS) {
        if (walls[wall]) {
          nextBoard = addWall(nextBoard, globalIndex, WALL_TO_DIRECTION[wall]);
        }
      }
    });
  }

  return nextBoard;
}

export function assembleModularBoard(config: ModularBoardConfig): Board {
  assertValidPlacements(config.placements);

  let board = createEmptyBoard(BOARD_SIZE, BOARD_SIZE);

  for (const placement of config.placements) {
    board = addModuleWalls(board, placement);
  }

  for (const placement of config.placements) {
    board = addPlacementEdgeStoppers(board, placement);
  }

  return addCenterBlock(addOuterWalls(board));
}
