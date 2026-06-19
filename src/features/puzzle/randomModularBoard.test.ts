import { describe, expect, it } from 'vitest';
import {
  createRandomModularBoard,
  createRandomModularConfig,
  pickRandomModules,
  pickRandomRotation,
  shuffleSlots,
} from './randomModularBoard';
import { sampleModules } from './sampleModules';
import type { BoardModule, ModuleSlot } from './moduleTypes';

function createMockRandom(values: number[]): () => number {
  let index = 0;

  return () => {
    const value = values[index % values.length];
    index += 1;

    return value;
  };
}

function createExtraModule(id: string): BoardModule {
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

function slotSet(slots: ModuleSlot[]): Set<ModuleSlot> {
  return new Set(slots);
}

describe('random modular board generation', () => {
  it('picks modules without duplicates', () => {
    const modules = [...sampleModules, createExtraModule('extra-a'), createExtraModule('extra-b')];
    const picked = pickRandomModules(modules, 4, createMockRandom([0, 0.8, 0.2, 0.5]));
    const ids = picked.map((module) => module.id);

    expect(picked).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it('throws when fewer than four modules are available', () => {
    expect(() => pickRandomModules(sampleModules.slice(0, 3), 4)).toThrow('At least 4');
  });

  it('shuffles all slots exactly once', () => {
    const slots = shuffleSlots(createMockRandom([0.75, 0.1, 0.4]));

    expect(slots).toHaveLength(4);
    expect(slotSet(slots)).toEqual(
      new Set<ModuleSlot>(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'])
    );
  });

  it('picks a deterministic rotation from the provided random source', () => {
    expect(pickRandomRotation(createMockRandom([0]))).toBe(0);
    expect(pickRandomRotation(createMockRandom([0.26]))).toBe(90);
    expect(pickRandomRotation(createMockRandom([0.51]))).toBe(180);
    expect(pickRandomRotation(createMockRandom([0.76]))).toBe(270);
  });

  it('creates the same config for the same random sequence', () => {
    const values = [0.2, 0.7, 0.1, 0.4, 0.6, 0.3, 0.8, 0.05, 0.9, 0.15, 0.45];
    const first = createRandomModularConfig({
      modules: sampleModules,
      random: createMockRandom(values),
    });
    const second = createRandomModularConfig({
      modules: sampleModules,
      random: createMockRandom(values),
    });

    expect(first).toEqual(second);
  });

  it('uses zero rotation when rotation is disabled', () => {
    const config = createRandomModularConfig({
      modules: sampleModules,
      random: createMockRandom([0.2, 0.4, 0.6, 0.8]),
      allowRotation: false,
    });

    expect(config.placements.every((placement) => placement.rotation === 0)).toBe(true);
  });

  it('creates four placements with each slot used exactly once', () => {
    const config = createRandomModularConfig({
      modules: sampleModules,
      random: createMockRandom([0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7]),
    });

    expect(config.placements).toHaveLength(4);
    expect(slotSet(config.placements.map((placement) => placement.slot))).toEqual(
      new Set<ModuleSlot>(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'])
    );
  });

  it('creates a 16x16 board with 256 wall records', () => {
    const result = createRandomModularBoard({
      modules: sampleModules,
      random: createMockRandom([0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7]),
    });

    expect(result.config.placements).toHaveLength(4);
    expect(result.board.width).toBe(16);
    expect(result.board.height).toBe(16);
    expect(result.board.walls).toHaveLength(256);
  });
});
