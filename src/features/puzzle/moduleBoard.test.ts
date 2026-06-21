import { describe, expect, it } from 'vitest';
import { createEmptyBoard, getCellWalls, toIndex } from './board';
import { generateMoves } from './movement';
import {
  addCornerWallToModuleWalls,
  addEdgeStopperToModuleWalls,
  assembleModularBoard,
  createModuleWallsFromCornerWalls,
  createModuleWallsFromEdgeStoppers,
  createModuleWallsFromMetadata,
  getSlotOffset,
  moduleIndexToGlobalIndex,
  rotateCornerWall,
  rotateEdgeStopper,
  rotateModuleIndex,
  rotateWalls,
} from './moduleBoard';
import { sampleModularBoard, sampleModularConfig, sampleModules } from './sampleModules';
import type {
  BoardModule,
  ModuleCornerWall,
  ModuleEdge,
  ModuleEdgeStopper,
  ModulePlacement,
  ModularBoardConfig,
} from './moduleTypes';
import type { CellWalls, RobotState } from './types';

const walls: CellWalls = {
  top: true,
  right: false,
  bottom: false,
  left: false,
};

function createBlankModule(id: string): BoardModule {
  return {
    id,
    name: id,
    size: 8,
    walls: Array.from({ length: 64 }, () => ({
      top: false,
      right: false,
      bottom: false,
      left: false,
    })),
  };
}

function emptyModuleWalls(): CellWalls[] {
  return Array.from({ length: 64 }, () => ({
    top: false,
    right: false,
    bottom: false,
    left: false,
  }));
}

function getExpectedStopperWallRecords(placement: ModulePlacement) {
  return (placement.module.edgeStoppers ?? []).flatMap((stopper) => {
    const rotatedStopper = rotateEdgeStopper(stopper, placement.rotation);
    const stopperWalls = createModuleWallsFromEdgeStoppers([rotatedStopper]);

    return stopperWalls.flatMap((walls, moduleIndex) => {
      const localRow = Math.floor(moduleIndex / 8);
      const localCol = moduleIndex % 8;
      const { rowOffset, colOffset } = getSlotOffset(placement.slot);
      const row = rowOffset + localRow;
      const col = colOffset + localCol;

      return (['top', 'right', 'bottom', 'left'] as const)
        .filter((wallKey) => walls[wallKey])
        .map((wallKey) => ({
          row,
          col,
          wallKey,
          edge: rotatedStopper.edge,
        }));
    });
  });
}

function isOutsideEdgeForPlacement(slot: ModulePlacement['slot'], edge: ModuleEdge): boolean {
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

function getExpectedVisibleStopperWallRecords(placement: ModulePlacement) {
  const rotatedStoppers = (placement.module.edgeStoppers ?? []).map((stopper) =>
    rotateEdgeStopper(stopper, placement.rotation)
  );

  if (!rotatedStoppers.every((stopper) => isOutsideEdgeForPlacement(placement.slot, stopper.edge))) {
    return [];
  }

  return getExpectedStopperWallRecords(placement);
}

function isHorizontalStopper(edge: ModuleEdge): boolean {
  return edge === 'left' || edge === 'right';
}

function isVerticalStopper(edge: ModuleEdge): boolean {
  return edge === 'top' || edge === 'bottom';
}

describe('module board utilities', () => {
  it('rotates module indexes around an 8x8 module', () => {
    const index = 2 * 8 + 3;

    expect(rotateModuleIndex(index, 0)).toBe(2 * 8 + 3);
    expect(rotateModuleIndex(index, 90)).toBe(3 * 8 + 5);
    expect(rotateModuleIndex(index, 180)).toBe(5 * 8 + 4);
    expect(rotateModuleIndex(index, 270)).toBe(4 * 8 + 2);
  });

  it('rotates walls with the module rotation', () => {
    expect(rotateWalls(walls, 0)).toEqual({
      top: true,
      right: false,
      bottom: false,
      left: false,
    });
    expect(rotateWalls(walls, 90)).toEqual({
      top: false,
      right: true,
      bottom: false,
      left: false,
    });
    expect(rotateWalls(walls, 180)).toEqual({
      top: false,
      right: false,
      bottom: true,
      left: false,
    });
    expect(rotateWalls(walls, 270)).toEqual({
      top: false,
      right: false,
      bottom: false,
      left: true,
    });
  });

  it('adds corner walls for each L-wall orientation', () => {
    const topLeft = addCornerWallToModuleWalls(emptyModuleWalls(), {
      cell: 3 * 8 + 3,
      orientation: 'topLeft',
    });
    const topRight = addCornerWallToModuleWalls(emptyModuleWalls(), {
      cell: 3 * 8 + 3,
      orientation: 'topRight',
    });
    const bottomLeft = addCornerWallToModuleWalls(emptyModuleWalls(), {
      cell: 3 * 8 + 3,
      orientation: 'bottomLeft',
    });
    const bottomRight = addCornerWallToModuleWalls(emptyModuleWalls(), {
      cell: 3 * 8 + 3,
      orientation: 'bottomRight',
    });

    expect(topLeft[27].top).toBe(true);
    expect(topLeft[27].left).toBe(true);
    expect(topRight[27].top).toBe(true);
    expect(topRight[27].right).toBe(true);
    expect(bottomLeft[27].bottom).toBe(true);
    expect(bottomLeft[27].left).toBe(true);
    expect(bottomRight[27].bottom).toBe(true);
    expect(bottomRight[27].right).toBe(true);
  });

  it('creates module walls from four corner walls', () => {
    const cornerWalls: ModuleCornerWall[] = [
      { cell: 1 * 8 + 1, orientation: 'topLeft' },
      { cell: 2 * 8 + 4, orientation: 'topRight' },
      { cell: 4 * 8 + 2, orientation: 'bottomLeft' },
      { cell: 6 * 8 + 6, orientation: 'bottomRight' },
    ];
    const moduleWalls = createModuleWallsFromCornerWalls(cornerWalls);

    expect(moduleWalls[9].top).toBe(true);
    expect(moduleWalls[9].left).toBe(true);
    expect(moduleWalls[20].top).toBe(true);
    expect(moduleWalls[20].right).toBe(true);
    expect(moduleWalls[34].bottom).toBe(true);
    expect(moduleWalls[34].left).toBe(true);
    expect(moduleWalls[54].bottom).toBe(true);
    expect(moduleWalls[54].right).toBe(true);
  });

  it('creates a left edge stopper as a right-facing horizontal stop', () => {
    const moduleWalls = addEdgeStopperToModuleWalls(emptyModuleWalls(), {
      edge: 'left',
      offset: 3,
    });

    expect(moduleWalls[3 * 8].bottom).toBe(true);
    expect(moduleWalls[4 * 8].top).toBe(true);
  });

  it('creates a right edge stopper as a left-facing horizontal stop', () => {
    const moduleWalls = addEdgeStopperToModuleWalls(emptyModuleWalls(), {
      edge: 'right',
      offset: 3,
    });

    expect(moduleWalls[3 * 8 + 7].bottom).toBe(true);
    expect(moduleWalls[4 * 8 + 7].top).toBe(true);
  });

  it('creates a top edge stopper as a downward vertical stop', () => {
    const moduleWalls = addEdgeStopperToModuleWalls(emptyModuleWalls(), {
      edge: 'top',
      offset: 3,
    });

    expect(moduleWalls[3].right).toBe(true);
    expect(moduleWalls[4].left).toBe(true);
  });

  it('creates a bottom edge stopper as an upward vertical stop', () => {
    const moduleWalls = addEdgeStopperToModuleWalls(emptyModuleWalls(), {
      edge: 'bottom',
      offset: 3,
    });

    expect(moduleWalls[7 * 8 + 3].right).toBe(true);
    expect(moduleWalls[7 * 8 + 4].left).toBe(true);
  });

  it('creates module walls from horizontal and vertical edge stoppers', () => {
    const stoppers: ModuleEdgeStopper[] = [
      { edge: 'left', offset: 2 },
      { edge: 'top', offset: 5 },
    ];
    const moduleWalls = createModuleWallsFromEdgeStoppers(stoppers);

    expect(moduleWalls[16].bottom).toBe(true);
    expect(moduleWalls[24].top).toBe(true);
    expect(moduleWalls[5].right).toBe(true);
    expect(moduleWalls[6].left).toBe(true);
  });

  it('throws when edge stopper offset is invalid', () => {
    expect(() =>
      addEdgeStopperToModuleWalls(emptyModuleWalls(), {
        edge: 'left',
        offset: 0,
      })
    ).toThrow('valid range 1..5');

    expect(() =>
      addEdgeStopperToModuleWalls(emptyModuleWalls(), {
        edge: 'top',
        offset: 6,
      })
    ).toThrow('valid range 1..5');
  });

  it('combines corner and edge stopper metadata into module walls', () => {
    const cornerWalls: ModuleCornerWall[] = [
      { cell: 1 * 8 + 1, orientation: 'topLeft' },
      { cell: 2 * 8 + 4, orientation: 'topRight' },
      { cell: 4 * 8 + 2, orientation: 'bottomLeft' },
      { cell: 6 * 8 + 6, orientation: 'bottomRight' },
    ];
    const stoppers: ModuleEdgeStopper[] = [
      { edge: 'left', offset: 5 },
      { edge: 'top', offset: 5 },
    ];
    const moduleWalls = createModuleWallsFromMetadata(cornerWalls, stoppers);

    expect(moduleWalls[9].top).toBe(true);
    expect(moduleWalls[40].bottom).toBe(true);
    expect(moduleWalls[5].right).toBe(true);
  });

  it('rotates corner walls with cell and orientation together', () => {
    const cornerWall: ModuleCornerWall = {
      cell: 2 * 8 + 3,
      orientation: 'topLeft',
    };

    expect(rotateCornerWall(cornerWall, 90)).toEqual({
      cell: 3 * 8 + 5,
      orientation: 'topRight',
    });
    expect(rotateCornerWall(cornerWall, 180)).toEqual({
      cell: 5 * 8 + 4,
      orientation: 'bottomRight',
    });
    expect(rotateCornerWall(cornerWall, 270)).toEqual({
      cell: 4 * 8 + 2,
      orientation: 'bottomLeft',
    });
  });

  it('rotates edge stoppers with edge and offset together', () => {
    expect(rotateEdgeStopper({ edge: 'top', offset: 2 }, 90)).toEqual({
      edge: 'right',
      offset: 2,
    });
    expect(rotateEdgeStopper({ edge: 'right', offset: 2 }, 90)).toEqual({
      edge: 'bottom',
      offset: 4,
    });
    expect(rotateEdgeStopper({ edge: 'bottom', offset: 2 }, 180)).toEqual({
      edge: 'top',
      offset: 4,
    });
    expect(rotateEdgeStopper({ edge: 'left', offset: 2 }, 270)).toEqual({
      edge: 'bottom',
      offset: 2,
    });
  });

  it('returns the correct slot offsets', () => {
    expect(getSlotOffset('topLeft')).toEqual({ rowOffset: 0, colOffset: 0 });
    expect(getSlotOffset('topRight')).toEqual({ rowOffset: 0, colOffset: 8 });
    expect(getSlotOffset('bottomLeft')).toEqual({ rowOffset: 8, colOffset: 0 });
    expect(getSlotOffset('bottomRight')).toEqual({ rowOffset: 8, colOffset: 8 });
  });

  it('maps module indexes to global board indexes', () => {
    const globalIndex = moduleIndexToGlobalIndex(2 * 8 + 3, 'bottomRight', 90, sampleModularBoard);

    expect(globalIndex).toBe(toIndex(11, 13, sampleModularBoard));
  });

  it('assembles a 16x16 board with 256 wall records', () => {
    const board = assembleModularBoard(sampleModularConfig);

    expect(board.width).toBe(16);
    expect(board.height).toBe(16);
    expect(board.walls).toHaveLength(256);
  });

  it('applies the center block to assembled modular boards', () => {
    const board = assembleModularBoard(sampleModularConfig);

    expect(getCellWalls(board, toIndex(7, 7, board))).toEqual({
      top: true,
      right: true,
      bottom: true,
      left: true,
    });
    expect(getCellWalls(board, toIndex(8, 8, board))).toEqual({
      top: true,
      right: true,
      bottom: true,
      left: true,
    });
  });

  it('adds outer walls to the assembled board', () => {
    const board = assembleModularBoard(sampleModularConfig);

    expect(getCellWalls(board, toIndex(0, 0, board)).top).toBe(true);
    expect(getCellWalls(board, toIndex(0, 0, board)).left).toBe(true);
    expect(getCellWalls(board, toIndex(15, 15, board)).bottom).toBe(true);
    expect(getCellWalls(board, toIndex(15, 15, board)).right).toBe(true);
  });

  it('throws when a slot is missing', () => {
    const config: ModularBoardConfig = {
      placements: sampleModularConfig.placements.slice(0, 3),
    };

    expect(() => assembleModularBoard(config)).toThrow('exactly four');
  });

  it('throws when a slot is duplicated', () => {
    const config: ModularBoardConfig = {
      placements: [
        { module: sampleModules[0], slot: 'topLeft', rotation: 0 },
        { module: sampleModules[1], slot: 'topLeft', rotation: 90 },
        { module: sampleModules[2], slot: 'bottomLeft', rotation: 180 },
        { module: sampleModules[3], slot: 'bottomRight', rotation: 270 },
      ],
    };

    expect(() => assembleModularBoard(config)).toThrow('Duplicate module slot');
  });

  it('throws when a module does not have 64 wall records', () => {
    const badModule: BoardModule = {
      ...createBlankModule('bad'),
      walls: [],
    };
    const config: ModularBoardConfig = {
      placements: [
        { module: badModule, slot: 'topLeft', rotation: 0 },
        { module: sampleModules[1], slot: 'topRight', rotation: 90 },
        { module: sampleModules[2], slot: 'bottomLeft', rotation: 180 },
        { module: sampleModules[3], slot: 'bottomRight', rotation: 270 },
      ],
    };

    expect(() => assembleModularBoard(config)).toThrow('64 wall records');
  });

  it('creates the sample modular board', () => {
    expect(sampleModularBoard.width).toBe(16);
    expect(sampleModularBoard.height).toBe(16);
    expect(sampleModularBoard.walls).toHaveLength(256);
  });

  it('defines exactly four L-shaped corner walls for every sample module', () => {
    for (const boardModule of sampleModules) {
      expect(boardModule.cornerWalls).toHaveLength(4);
    }
  });

  it('keeps sample module base walls limited to corner wall metadata', () => {
    for (const boardModule of sampleModules) {
      expect(boardModule.walls).toEqual(createModuleWallsFromCornerWalls(boardModule.cornerWalls ?? []));
    }
  });

  it('defines exactly two edge stoppers for every sample module', () => {
    for (const boardModule of sampleModules) {
      expect(boardModule.edgeStoppers).toHaveLength(2);
    }
  });

  it('defines one horizontal and one vertical edge stopper for every sample module', () => {
    for (const boardModule of sampleModules) {
      const horizontalCount = (boardModule.edgeStoppers ?? []).filter(
        (stopper) => stopper.edge === 'left' || stopper.edge === 'right'
      ).length;
      const verticalCount = (boardModule.edgeStoppers ?? []).filter(
        (stopper) => stopper.edge === 'top' || stopper.edge === 'bottom'
      ).length;

      expect(horizontalCount).toBe(1);
      expect(verticalCount).toBe(1);
    }
  });

  it('keeps every sample edge stopper offset inside the safe range', () => {
    for (const boardModule of sampleModules) {
      for (const stopper of boardModule.edgeStoppers ?? []) {
        expect(stopper.offset).toBeGreaterThanOrEqual(1);
        expect(stopper.offset).toBeLessThanOrEqual(5);
      }
    }
  });

  it('applies sample edge stoppers only on the final board outer edge', () => {
    const board = assembleModularBoard(sampleModularConfig);
    const expectedWallRecords = sampleModularConfig.placements.flatMap(getExpectedVisibleStopperWallRecords);

    expect(expectedWallRecords).toHaveLength(16);

    for (const expected of expectedWallRecords) {
      expect(getCellWalls(board, toIndex(expected.row, expected.col, board))[expected.wallKey]).toBe(true);

      const touchesOuterEdge =
        expected.row === 0 ||
        expected.row === board.height - 1 ||
        expected.col === 0 ||
        expected.col === board.width - 1;

      expect(touchesOuterEdge).toBe(true);
    }
  });

  it('keeps four horizontal and four vertical edge stoppers on the final outer edge', () => {
    const rotatedStoppers = sampleModularConfig.placements.flatMap((placement) =>
      (placement.module.edgeStoppers ?? []).map((stopper) =>
        rotateEdgeStopper(stopper, placement.rotation)
      )
    );

    expect(rotatedStoppers.filter((stopper) => isHorizontalStopper(stopper.edge))).toHaveLength(4);
    expect(rotatedStoppers.filter((stopper) => isVerticalStopper(stopper.edge))).toHaveLength(4);
  });

  it('does not add edge stoppers on center seams for rotated placements', () => {
    const config: ModularBoardConfig = {
      placements: [
        { module: sampleModules[0], slot: 'topLeft', rotation: 180 },
        { module: sampleModules[1], slot: 'topRight', rotation: 270 },
        { module: sampleModules[2], slot: 'bottomLeft', rotation: 90 },
        { module: sampleModules[3], slot: 'bottomRight', rotation: 0 },
      ],
    };
    const boardWithStoppers = assembleModularBoard(config);
    const configWithoutStoppers: ModularBoardConfig = {
      placements: config.placements.map((placement) => ({
        ...placement,
        module: {
          ...placement.module,
          edgeStoppers: undefined,
        },
      })),
    };
    const boardWithoutStoppers = assembleModularBoard(configWithoutStoppers);
    const wallKeys: Array<keyof CellWalls> = ['top', 'right', 'bottom', 'left'];

    for (let index = 0; index < boardWithStoppers.walls.length; index += 1) {
      const row = Math.floor(index / boardWithStoppers.width);
      const col = index % boardWithStoppers.width;

      for (const wallKey of wallKeys) {
        const addedByStopper =
          boardWithStoppers.walls[index][wallKey] && !boardWithoutStoppers.walls[index][wallKey];

        if (addedByStopper) {
          const touchesOuterEdge =
            row === 0 ||
            row === boardWithStoppers.height - 1 ||
            col === 0 ||
            col === boardWithStoppers.width - 1;

          expect(touchesOuterEdge).toBe(true);
        }
      }
    }
  });

  it('throws when corner wall metadata exists but does not contain four records', () => {
    const badModule: BoardModule = {
      ...createBlankModule('bad-corners'),
      cornerWalls: [{ cell: 0, orientation: 'topLeft' }],
    };
    const config: ModularBoardConfig = {
      placements: [
        { module: badModule, slot: 'topLeft', rotation: 0 },
        { module: sampleModules[1], slot: 'topRight', rotation: 90 },
        { module: sampleModules[2], slot: 'bottomLeft', rotation: 180 },
        { module: sampleModules[3], slot: 'bottomRight', rotation: 270 },
      ],
    };

    expect(() => assembleModularBoard(config)).toThrow('exactly 4 corner walls');
  });

  it('throws when edge stopper metadata exists but does not contain two records', () => {
    const badModule: BoardModule = {
      ...createBlankModule('bad-stoppers'),
      edgeStoppers: [{ edge: 'left', offset: 2 }],
    };
    const config: ModularBoardConfig = {
      placements: [
        { module: badModule, slot: 'topLeft', rotation: 0 },
        { module: sampleModules[1], slot: 'topRight', rotation: 90 },
        { module: sampleModules[2], slot: 'bottomLeft', rotation: 180 },
        { module: sampleModules[3], slot: 'bottomRight', rotation: 270 },
      ],
    };

    expect(() => assembleModularBoard(config)).toThrow('exactly 2 edge stoppers');
  });

  it('throws when edge stopper metadata does not include both kinds', () => {
    const badModule: BoardModule = {
      ...createBlankModule('bad-stopper-kinds'),
      edgeStoppers: [
        { edge: 'left', offset: 2 },
        { edge: 'right', offset: 4 },
      ],
    };
    const config: ModularBoardConfig = {
      placements: [
        { module: badModule, slot: 'topLeft', rotation: 0 },
        { module: sampleModules[1], slot: 'topRight', rotation: 90 },
        { module: sampleModules[2], slot: 'bottomLeft', rotation: 180 },
        { module: sampleModules[3], slot: 'bottomRight', rotation: 270 },
      ],
    };

    expect(() => assembleModularBoard(config)).toThrow('one horizontal and one vertical');
  });

  it('throws when edge stoppers are too close to corner walls', () => {
    const badModule: BoardModule = {
      ...createBlankModule('bad-stopper-distance'),
      cornerWalls: [
        { cell: 2 * 8, orientation: 'topRight' },
        { cell: 2 * 8 + 5, orientation: 'bottomLeft' },
        { cell: 4 * 8 + 3, orientation: 'topLeft' },
        { cell: 6 * 8 + 5, orientation: 'bottomRight' },
      ],
      edgeStoppers: [
        { edge: 'left', offset: 2 },
        { edge: 'top', offset: 4 },
      ],
    };
    const config: ModularBoardConfig = {
      placements: [
        { module: badModule, slot: 'topLeft', rotation: 0 },
        { module: sampleModules[1], slot: 'topRight', rotation: 90 },
        { module: sampleModules[2], slot: 'bottomLeft', rotation: 180 },
        { module: sampleModules[3], slot: 'bottomRight', rotation: 270 },
      ],
    };

    expect(() => assembleModularBoard(config)).toThrow('at least 2 cells away');
  });

  it('can build corner walls on module edges without throwing', () => {
    const walls = createModuleWallsFromCornerWalls([
      { cell: 0, orientation: 'topLeft' },
      { cell: 7, orientation: 'topRight' },
      { cell: 56, orientation: 'bottomLeft' },
      { cell: 63, orientation: 'bottomRight' },
    ]);

    expect(walls).toHaveLength(64);
    expect(walls[0].top).toBe(true);
    expect(walls[0].left).toBe(true);
  });

  it('uses wall records that are compatible with board helpers', () => {
    const board = createEmptyBoard(8, 8);
    const walls = createModuleWallsFromCornerWalls([
      { cell: toIndex(3, 3, board), orientation: 'topLeft' },
      { cell: toIndex(3, 4, board), orientation: 'topRight' },
      { cell: toIndex(4, 3, board), orientation: 'bottomLeft' },
      { cell: toIndex(4, 4, board), orientation: 'bottomRight' },
    ]);

    expect(walls[toIndex(2, 3, board)].bottom).toBe(true);
    expect(walls[toIndex(3, 2, board)].right).toBe(true);
  });

  it('is compatible with existing movement generation', () => {
    const robots: RobotState = {
      red: toIndex(0, 0, sampleModularBoard),
      blue: toIndex(0, 6, sampleModularBoard),
      yellow: toIndex(5, 5, sampleModularBoard),
      green: toIndex(12, 12, sampleModularBoard),
      black: toIndex(15, 15, sampleModularBoard),
    };

    expect(generateMoves(sampleModularBoard, robots).length).toBeGreaterThan(0);
  });
});
