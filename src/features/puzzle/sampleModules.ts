import { assembleModularBoard } from './moduleBoard';
import {
  photoBottomLeftModule,
  photoBottomRightModule,
  photoModules,
  photoTopLeftModule,
  photoTopRightModule,
} from './photoModules';
import type { ModularBoardConfig } from './moduleTypes';
import type { Board } from './types';

export const sampleModules = photoModules;

export const sampleModularConfig: ModularBoardConfig = {
  placements: [
    { module: photoTopLeftModule, slot: 'topLeft', rotation: 0 },
    { module: photoTopRightModule, slot: 'topRight', rotation: 0 },
    { module: photoBottomLeftModule, slot: 'bottomLeft', rotation: 0 },
    { module: photoBottomRightModule, slot: 'bottomRight', rotation: 0 },
  ],
};

export const sampleModularBoard: Board = assembleModularBoard(sampleModularConfig);
