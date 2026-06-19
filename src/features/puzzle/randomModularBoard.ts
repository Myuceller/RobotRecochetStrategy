import { assembleModularBoard } from './moduleBoard';
import type {
  BoardModule,
  ModularBoardConfig,
  ModuleSlot,
  Rotation,
} from './moduleTypes';
import type { Board } from './types';

export type RandomSource = () => number;

export type RandomModularBoardOptions = {
  modules: BoardModule[];
  random?: RandomSource;
  allowRotation?: boolean;
};

export type RandomModularBoardResult = {
  config: ModularBoardConfig;
  board: Board;
};

const MODULE_COUNT = 4;
const MODULE_SLOTS: ModuleSlot[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
const ROTATIONS: Rotation[] = [0, 90, 180, 270];

function getRandomIndex(length: number, random: RandomSource): number {
  return Math.floor(random() * length);
}

function getRandomSource(random?: RandomSource): RandomSource {
  return random ?? Math.random;
}

export function pickRandomModules(
  modules: BoardModule[],
  count: number,
  random?: RandomSource
): BoardModule[] {
  if (modules.length < count) {
    throw new Error(`At least ${count} modules are required.`);
  }

  const source = getRandomSource(random);
  const pool = [...modules];
  const picked: BoardModule[] = [];

  while (picked.length < count) {
    const index = getRandomIndex(pool.length, source);
    const [module] = pool.splice(index, 1);
    picked.push(module);
  }

  return picked;
}

export function shuffleSlots(random?: RandomSource): ModuleSlot[] {
  const source = getRandomSource(random);
  const slots = [...MODULE_SLOTS];

  for (let index = slots.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomIndex(index + 1, source);
    const current = slots[index];
    slots[index] = slots[swapIndex];
    slots[swapIndex] = current;
  }

  return slots;
}

export function pickRandomRotation(random?: RandomSource): Rotation {
  const source = getRandomSource(random);

  return ROTATIONS[getRandomIndex(ROTATIONS.length, source)];
}

export function createRandomModularConfig(
  options: RandomModularBoardOptions
): ModularBoardConfig {
  const source = getRandomSource(options.random);
  const allowRotation = options.allowRotation ?? true;
  const modules = pickRandomModules(options.modules, MODULE_COUNT, source);
  const slots = shuffleSlots(source);

  return {
    placements: modules.map((module, index) => ({
      module,
      slot: slots[index],
      rotation: allowRotation ? pickRandomRotation(source) : 0,
    })),
  };
}

export function createRandomModularBoard(
  options: RandomModularBoardOptions
): RandomModularBoardResult {
  const config = createRandomModularConfig(options);

  return {
    config,
    board: assembleModularBoard(config),
  };
}
