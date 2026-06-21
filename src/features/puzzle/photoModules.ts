import { createModuleWallsFromCornerWalls } from './moduleBoard';
import type { BoardModule, ModuleCornerWall } from './moduleTypes';

const MODULE_SIZE = 8;

function createPhotoModule(
  id: string,
  name: string,
  cornerWalls: ModuleCornerWall[],
  edgeStoppers: BoardModule['edgeStoppers']
): BoardModule {
  return {
    id,
    name,
    size: MODULE_SIZE,
    cornerWalls,
    edgeStoppers,
    walls: createModuleWallsFromCornerWalls(cornerWalls),
  };
}

export const photoTopLeftModule: BoardModule = createPhotoModule(
  'photo-top-left',
  'Photo Top Left',
  [
    { cell: 1 * 8 + 4, orientation: 'topRight' },
    { cell: 3 * 8 + 1, orientation: 'bottomLeft' },
    { cell: 5 * 8 + 5, orientation: 'topLeft' },
    { cell: 6 * 8 + 3, orientation: 'bottomRight' },
  ],
  [
    { edge: 'top', offset: 1 },
    { edge: 'left', offset: 5 },
  ]
);

export const photoTopRightModule: BoardModule = createPhotoModule(
  'photo-top-right',
  'Photo Top Right',
  [
    { cell: 1 * 8 + 3, orientation: 'topLeft' },
    { cell: 3 * 8 + 6, orientation: 'topRight' },
    { cell: 4 * 8 + 1, orientation: 'bottomLeft' },
    { cell: 6 * 8 + 4, orientation: 'bottomLeft' },
  ],
  [
    { edge: 'top', offset: 1 },
    { edge: 'right', offset: 4 },
  ]
);

export const photoBottomLeftModule: BoardModule = createPhotoModule(
  'photo-bottom-left',
  'Photo Bottom Left',
  [
    { cell: 2 * 8 + 3, orientation: 'bottomRight' },
    { cell: 3 * 8 + 5, orientation: 'topRight' },
    { cell: 4 * 8 + 2, orientation: 'bottomLeft' },
    { cell: 5 * 8 + 4, orientation: 'topLeft' },
  ],
  [
    { edge: 'left', offset: 1 },
    { edge: 'bottom', offset: 4 },
  ]
);

export const photoBottomRightModule: BoardModule = createPhotoModule(
  'photo-bottom-right',
  'Photo Bottom Right',
  [
    { cell: 2 * 8 + 1, orientation: 'bottomRight' },
    { cell: 1 * 8 + 6, orientation: 'bottomLeft' },
    { cell: 3 * 8 + 4, orientation: 'topLeft' },
    { cell: 6 * 8 + 2, orientation: 'topRight' },
  ],
  [
    { edge: 'right', offset: 3 },
    { edge: 'bottom', offset: 3 },
  ]
);

export const photoModules: BoardModule[] = [
  photoTopLeftModule,
  photoTopRightModule,
  photoBottomLeftModule,
  photoBottomRightModule,
];
