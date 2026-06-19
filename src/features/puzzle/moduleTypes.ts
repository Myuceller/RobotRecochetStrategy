import type { CellWalls } from './types';

export type ModuleCellIndex = number;

export type ModuleSlot = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export type Rotation = 0 | 90 | 180 | 270;

export type CornerWallOrientation = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export type ModuleCornerWall = {
  cell: ModuleCellIndex;
  orientation: CornerWallOrientation;
};

export type ModuleEdge = 'top' | 'right' | 'bottom' | 'left';

export type EdgeStopperKind = 'horizontal' | 'vertical';

export type ModuleEdgeStopper = {
  edge: ModuleEdge;
  offset: number;
};

export type BoardModule = {
  id: string;
  name: string;
  size: 8;
  walls: CellWalls[];
  cornerWalls?: ModuleCornerWall[];
  edgeStoppers?: ModuleEdgeStopper[];
};

export type ModulePlacement = {
  module: BoardModule;
  slot: ModuleSlot;
  rotation: Rotation;
};

export type ModularBoardConfig = {
  placements: ModulePlacement[];
};
