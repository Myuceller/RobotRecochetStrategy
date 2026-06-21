import { addWall, createEmptyBoard, toIndex } from '../board';
import type { Board } from '../types';

export type QuadrantId = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export type BoardSlot = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export type CutCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export type TargetColor = 'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'gray' | 'black';

export type TargetShape = 'circle' | 'triangle' | 'diamond' | 'cross' | 'hex';

export type Corner = 'nw' | 'ne' | 'sw' | 'se';

export type Wall = {
  x: number;
  y: number;
  orientation: 'vertical' | 'horizontal';
};

export type Cell = {
  x: number;
  y: number;
};

export type BorderStub = {
  side: 'top' | 'right' | 'bottom' | 'left';
  index: number;
};

export type QuadrantTarget = {
  id: number;
  x: number;
  y: number;
  color: TargetColor;
  shape: TargetShape;
  corner: Corner;
};

export type RawQuadrant = {
  id: QuadrantId;
  size: 8;
  cutCorner: CutCorner;
  targets: QuadrantTarget[];
  borderStubs: BorderStub[];
};

export type MaterializedQuadrant = {
  id: QuadrantId;
  size: 8;
  cutCorner: CutCorner;
  cutCells: Cell[];
  targets: QuadrantTarget[];
  walls: Wall[];
};

export type ComposedPhotoBoard = {
  size: 16;
  walls: Wall[];
  targets: QuadrantTarget[];
  blockedCells: Cell[];
  meta: {
    source: 'photo-board-v5';
    order: Record<BoardSlot, QuadrantId>;
    rotations: Record<BoardSlot, number>;
    centerMode: 'cutout';
  };
};

export const PHOTO_BOARD_TOP_LEFT: RawQuadrant = {
  id: 'topLeft',
  size: 8,
  cutCorner: 'bottomRight',
  targets: [
    { id: 1, x: 5, y: 1, color: 'blue', shape: 'circle', corner: 'sw' },
    { id: 2, x: 3, y: 4, color: 'red', shape: 'cross', corner: 'se' },
    { id: 3, x: 6, y: 5, color: 'green', shape: 'diamond', corner: 'nw' },
    { id: 4, x: 1, y: 6, color: 'yellow', shape: 'triangle', corner: 'ne' },
  ],
  borderStubs: [
    { side: 'top', index: 3 },
    { side: 'left', index: 4 },
  ],
};

export const PHOTO_BOARD_TOP_RIGHT: RawQuadrant = {
  id: 'topRight',
  size: 8,
  cutCorner: 'bottomLeft',
  targets: [
    { id: 5, x: 3, y: 1, color: 'red', shape: 'circle', corner: 'nw' },
    { id: 6, x: 6, y: 3, color: 'green', shape: 'triangle', corner: 'ne' },
    { id: 7, x: 1, y: 4, color: 'blue', shape: 'diamond', corner: 'se' },
    { id: 8, x: 4, y: 6, color: 'yellow', shape: 'hex', corner: 'sw' },
  ],
  borderStubs: [
    { side: 'top', index: 1 },
    { side: 'right', index: 2 },
  ],
};

export const PHOTO_BOARD_BOTTOM_LEFT: RawQuadrant = {
  id: 'bottomLeft',
  size: 8,
  cutCorner: 'topRight',
  targets: [
    { id: 9, x: 3, y: 2, color: 'blue', shape: 'triangle', corner: 'se' },
    { id: 10, x: 5, y: 3, color: 'green', shape: 'cross', corner: 'ne' },
    { id: 11, x: 2, y: 4, color: 'yellow', shape: 'circle', corner: 'sw' },
    { id: 12, x: 4, y: 5, color: 'red', shape: 'diamond', corner: 'nw' },
  ],
  borderStubs: [
    { side: 'left', index: 2 },
    { side: 'bottom', index: 4 },
  ],
};

export const PHOTO_BOARD_BOTTOM_RIGHT: RawQuadrant = {
  id: 'bottomRight',
  size: 8,
  cutCorner: 'topLeft',
  targets: [
    { id: 13, x: 4, y: 1, color: 'blue', shape: 'cross', corner: 'nw' },
    { id: 14, x: 2, y: 2, color: 'yellow', shape: 'diamond', corner: 'se' },
    { id: 15, x: 6, y: 4, color: 'red', shape: 'triangle', corner: 'ne' },
    { id: 16, x: 3, y: 6, color: 'green', shape: 'circle', corner: 'sw' },
  ],
  borderStubs: [
    { side: 'right', index: 2 },
    { side: 'bottom', index: 6 },
  ],
};

export const PHOTO_BOARD_QUADRANTS = {
  topLeft: PHOTO_BOARD_TOP_LEFT,
  topRight: PHOTO_BOARD_TOP_RIGHT,
  bottomLeft: PHOTO_BOARD_BOTTOM_LEFT,
  bottomRight: PHOTO_BOARD_BOTTOM_RIGHT,
} as const;

export const SLOT_OFFSETS: Record<BoardSlot, Cell> = {
  topLeft: { x: 0, y: 0 },
  topRight: { x: 8, y: 0 },
  bottomLeft: { x: 0, y: 8 },
  bottomRight: { x: 8, y: 8 },
};

export const SLOT_REQUIRED_CUT_CELL: Record<BoardSlot, Cell> = {
  topLeft: { x: 7, y: 7 },
  topRight: { x: 0, y: 7 },
  bottomLeft: { x: 7, y: 0 },
  bottomRight: { x: 0, y: 0 },
};

export function getCutCell(cutCorner: CutCorner): Cell {
  switch (cutCorner) {
    case 'topLeft':
      return { x: 0, y: 0 };
    case 'topRight':
      return { x: 7, y: 0 };
    case 'bottomLeft':
      return { x: 0, y: 7 };
    case 'bottomRight':
      return { x: 7, y: 7 };
  }
}

export function getCutCornerFromCell(cell: Cell): CutCorner {
  if (cell.x === 0 && cell.y === 0) {
    return 'topLeft';
  }

  if (cell.x === 7 && cell.y === 0) {
    return 'topRight';
  }

  if (cell.x === 0 && cell.y === 7) {
    return 'bottomLeft';
  }

  if (cell.x === 7 && cell.y === 7) {
    return 'bottomRight';
  }

  throw new Error(`Invalid cut corner cell: ${cell.x}, ${cell.y}`);
}

export function getCornerWalls(target: QuadrantTarget): Wall[] {
  const { x, y, corner } = target;
  const walls: Wall[] = [];

  if (corner.includes('n')) {
    walls.push({ x, y, orientation: 'horizontal' });
  }

  if (corner.includes('s')) {
    walls.push({ x, y: y + 1, orientation: 'horizontal' });
  }

  if (corner.includes('w')) {
    walls.push({ x, y, orientation: 'vertical' });
  }

  if (corner.includes('e')) {
    walls.push({ x: x + 1, y, orientation: 'vertical' });
  }

  return walls;
}

export function getBorderStubWall(stub: BorderStub): Wall {
  const { side, index } = stub;

  switch (side) {
    case 'top':
      return { x: index, y: 0, orientation: 'vertical' };
    case 'bottom':
      return { x: index, y: 7, orientation: 'vertical' };
    case 'left':
      return { x: 0, y: index, orientation: 'horizontal' };
    case 'right':
      return { x: 7, y: index, orientation: 'horizontal' };
  }
}

export function materializeQuadrant(raw: RawQuadrant): MaterializedQuadrant {
  const targetWalls = raw.targets.flatMap(getCornerWalls);
  const borderWalls = raw.borderStubs.map(getBorderStubWall);
  const cutCell = getCutCell(raw.cutCorner);

  return {
    id: raw.id,
    size: raw.size,
    cutCorner: raw.cutCorner,
    cutCells: [cutCell],
    targets: raw.targets.map((target) => ({ ...target })),
    walls: uniqueWalls([...targetWalls, ...borderWalls]),
  };
}

export function rotateCellClockwise(cell: Cell): Cell {
  return {
    x: 7 - cell.y,
    y: cell.x,
  };
}

export function rotateWallClockwise(wall: Wall): Wall {
  if (wall.orientation === 'vertical') {
    return {
      x: 7 - wall.y,
      y: wall.x,
      orientation: 'horizontal',
    };
  }

  return {
    x: 8 - wall.y,
    y: wall.x,
    orientation: 'vertical',
  };
}

export function normalizeCorner(value: string): Corner {
  const hasN = value.includes('n');
  const hasS = value.includes('s');
  const hasW = value.includes('w');
  const hasE = value.includes('e');

  if (hasN && hasW) {
    return 'nw';
  }

  if (hasN && hasE) {
    return 'ne';
  }

  if (hasS && hasW) {
    return 'sw';
  }

  if (hasS && hasE) {
    return 'se';
  }

  throw new Error(`Invalid corner: ${value}`);
}

export function rotateCornerClockwise(corner: Corner): Corner {
  const rotated = corner
    .split('')
    .map((char) => {
      if (char === 'n') {
        return 'e';
      }

      if (char === 'e') {
        return 's';
      }

      if (char === 's') {
        return 'w';
      }

      if (char === 'w') {
        return 'n';
      }

      return char;
    })
    .join('');

  return normalizeCorner(rotated);
}

export function rotateTargetClockwise(target: QuadrantTarget): QuadrantTarget {
  const cell = rotateCellClockwise({ x: target.x, y: target.y });

  return {
    ...target,
    x: cell.x,
    y: cell.y,
    corner: rotateCornerClockwise(target.corner),
  };
}

export function rotateQuadrantClockwise(
  quadrant: MaterializedQuadrant
): MaterializedQuadrant {
  const cutCell = rotateCellClockwise(quadrant.cutCells[0]);

  return {
    ...quadrant,
    cutCorner: getCutCornerFromCell(cutCell),
    cutCells: [cutCell],
    targets: quadrant.targets.map(rotateTargetClockwise),
    walls: uniqueWalls(quadrant.walls.map(rotateWallClockwise)),
  };
}

export function rotateQuadrant(
  quadrant: MaterializedQuadrant,
  times: number
): MaterializedQuadrant {
  let result = cloneQuadrant(quadrant);
  const normalizedTimes = ((times % 4) + 4) % 4;

  for (let index = 0; index < normalizedTimes; index += 1) {
    result = rotateQuadrantClockwise(result);
  }

  return result;
}

export function findRotationForSlot(
  quadrant: MaterializedQuadrant,
  slot: BoardSlot
): number {
  const required = SLOT_REQUIRED_CUT_CELL[slot];

  for (let rotation = 0; rotation < 4; rotation += 1) {
    const rotated = rotateQuadrant(quadrant, rotation);
    const cutCell = rotated.cutCells[0];

    if (cutCell.x === required.x && cutCell.y === required.y) {
      return rotation;
    }
  }

  throw new Error(`Cannot rotate quadrant ${quadrant.id} to fit slot ${slot}`);
}

export function composePhotoBoard(
  order: Record<BoardSlot, QuadrantId>,
  options?: {
    includeCenterBlockWalls?: boolean;
  }
): ComposedPhotoBoard {
  const rotations: Record<BoardSlot, number> = {
    topLeft: 0,
    topRight: 0,
    bottomLeft: 0,
    bottomRight: 0,
  };
  const globalWalls: Wall[] = [];
  const globalTargets: QuadrantTarget[] = [];
  const globalBlockedCells: Cell[] = [];

  for (const slot of Object.keys(order) as BoardSlot[]) {
    const quadrantId = order[slot];
    const materialized = materializeQuadrant(PHOTO_BOARD_QUADRANTS[quadrantId]);
    const rotation = findRotationForSlot(materialized, slot);
    const rotated = rotateQuadrant(materialized, rotation);
    const offset = SLOT_OFFSETS[slot];

    rotations[slot] = rotation;

    globalWalls.push(
      ...rotated.walls.map((wall) => ({
        ...wall,
        x: wall.x + offset.x,
        y: wall.y + offset.y,
      }))
    );
    globalTargets.push(
      ...rotated.targets.map((target) => ({
        ...target,
        x: target.x + offset.x,
        y: target.y + offset.y,
      }))
    );
    globalBlockedCells.push(
      ...rotated.cutCells.map((cell) => ({
        x: cell.x + offset.x,
        y: cell.y + offset.y,
      }))
    );
  }

  const boardWalls = uniqueWalls(filterOuterBoundaryWalls(globalWalls, 16));
  const includeCenterBlockWalls = options?.includeCenterBlockWalls ?? true;

  return {
    size: 16,
    walls: includeCenterBlockWalls
      ? uniqueWalls([...boardWalls, ...getBlockedCellWalls(globalBlockedCells, 16)])
      : boardWalls,
    targets: globalTargets,
    blockedCells: globalBlockedCells,
    meta: {
      source: 'photo-board-v5',
      order,
      rotations,
      centerMode: 'cutout',
    },
  };
}

export function getBlockedCellWalls(cells: Cell[], boardSize: number): Wall[] {
  const walls: Wall[] = [];

  for (const cell of cells) {
    const { x, y } = cell;

    if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) {
      continue;
    }

    walls.push(
      { x, y, orientation: 'horizontal' },
      { x, y: y + 1, orientation: 'horizontal' },
      { x, y, orientation: 'vertical' },
      { x: x + 1, y, orientation: 'vertical' }
    );
  }

  return uniqueWalls(walls);
}

export function filterOuterBoundaryWalls(walls: Wall[], boardSize: number): Wall[] {
  return walls.filter((wall) => {
    if (wall.orientation === 'vertical') {
      return wall.x > 0 && wall.x < boardSize;
    }

    return wall.y > 0 && wall.y < boardSize;
  });
}

export function uniqueWalls(walls: Wall[]): Wall[] {
  const seen = new Set<string>();
  const result: Wall[] = [];

  for (const wall of walls) {
    const key = `${wall.orientation}:${wall.x},${wall.y}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(wall);
  }

  return result;
}

export function cloneQuadrant(quadrant: MaterializedQuadrant): MaterializedQuadrant {
  return {
    ...quadrant,
    cutCells: quadrant.cutCells.map((cell) => ({ ...cell })),
    targets: quadrant.targets.map((target) => ({ ...target })),
    walls: quadrant.walls.map((wall) => ({ ...wall })),
  };
}

export function cloneBoard(board: ComposedPhotoBoard): ComposedPhotoBoard {
  return {
    ...board,
    walls: board.walls.map((wall) => ({ ...wall })),
    targets: board.targets.map((target) => ({ ...target })),
    blockedCells: board.blockedCells.map((cell) => ({ ...cell })),
    meta: {
      ...board.meta,
      order: { ...board.meta.order },
      rotations: { ...board.meta.rotations },
    },
  };
}

export function photoWallsToBoard(walls: Wall[], size = 16): Board {
  let board = createEmptyBoard(size, size);

  for (const wall of walls) {
    if (wall.orientation === 'vertical') {
      if (wall.x <= 0) {
        board = addWall(board, toIndex(wall.y, 0, board), 'left');
      } else if (wall.x >= size) {
        board = addWall(board, toIndex(wall.y, size - 1, board), 'right');
      } else {
        board = addWall(board, toIndex(wall.y, wall.x, board), 'left');
      }
    } else if (wall.y <= 0) {
      board = addWall(board, toIndex(0, wall.x, board), 'up');
    } else if (wall.y >= size) {
      board = addWall(board, toIndex(size - 1, wall.x, board), 'down');
    } else {
      board = addWall(board, toIndex(wall.y, wall.x, board), 'up');
    }
  }

  return board;
}

export function composedPhotoBoardToBoard(photoBoard: ComposedPhotoBoard): Board {
  return photoWallsToBoard(photoBoard.walls, photoBoard.size);
}

export const ORIGINAL_PHOTO_BOARD = composePhotoBoard({
  topLeft: 'topLeft',
  topRight: 'topRight',
  bottomLeft: 'bottomLeft',
  bottomRight: 'bottomRight',
});

export const SHUFFLED_PHOTO_BOARD_1 = composePhotoBoard({
  topLeft: 'bottomRight',
  topRight: 'bottomLeft',
  bottomLeft: 'topRight',
  bottomRight: 'topLeft',
});

export function getRandomPhotoBoard(random: () => number = Math.random): ComposedPhotoBoard {
  const ids: QuadrantId[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
  const shuffled = [...ids];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = shuffled[index];

    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return cloneBoard(
    composePhotoBoard({
      topLeft: shuffled[0],
      topRight: shuffled[1],
      bottomLeft: shuffled[2],
      bottomRight: shuffled[3],
    })
  );
}
