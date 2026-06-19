import { getCenterBlockedCells, toIndex } from './board';
import { fixedUserBoard, fixedUserPuzzle } from './fixedUserMap';
import { generateSolvablePuzzle } from './randomPuzzle';
import { sampleBoard, samplePuzzle } from './sampleBoard';
import { sampleModularBoard } from './sampleModules';
import type { Board, PuzzleState } from './types';

export type SamplePuzzleId = string;

export type SamplePuzzleDefinition = {
  id: SamplePuzzleId;
  title: string;
  description: string;
  board: Board;
  puzzle: PuzzleState;
  expectedDepth?: number;
  source: 'photo-quadrant-sample' | 'fixed-sample' | 'classic-sample' | 'modular-sample';
};

function createSequenceRandom(values: number[]): () => number {
  let index = 0;

  return () => {
    const value = values[index % values.length];
    index += 1;

    return value;
  };
}

const photoQuadrantSample = generateSolvablePuzzle({
  modules: [],
  random: createSequenceRandom([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    5 / 255,
    83 / 254,
    201 / 253,
    0,
    4 / 252,
  ]),
  maxAttempts: 10,
  difficulty: {
    minDepth: 1,
    maxDepth: 50,
  },
});

const modularPuzzle: PuzzleState = {
  robots: {
    red: toIndex(1, 0, sampleModularBoard),
    blue: toIndex(13, 6, sampleModularBoard),
    yellow: toIndex(10, 10, sampleModularBoard),
    green: toIndex(3, 12, sampleModularBoard),
  },
  targetRobot: 'red',
  targetCell: toIndex(1, 4, sampleModularBoard),
};

const centerBlockedCells = getCenterBlockedCells(sampleModularBoard);

if (centerBlockedCells.some((cell) => Object.values(modularPuzzle.robots).includes(cell))) {
  throw new Error('Modular sample robots must not start on center blocked cells.');
}

if (centerBlockedCells.includes(modularPuzzle.targetCell)) {
  throw new Error('Modular sample target must not use a center blocked cell.');
}

export const samplePuzzles: SamplePuzzleDefinition[] = [
  {
    id: 'photo-quadrant-generated',
    title: 'Photo Quadrant Sample',
    description: 'A solver-validated sample built from the 8x8 quadrant composition system.',
    board: photoQuadrantSample.board,
    puzzle: photoQuadrantSample.puzzle,
    expectedDepth: photoQuadrantSample.solution.depth,
    source: 'photo-quadrant-sample',
  },
  {
    id: 'fixed-user-map',
    title: 'Fixed User Map',
    description: 'The fixed 16x16 wall layout provided for stable solver practice.',
    board: fixedUserBoard,
    puzzle: fixedUserPuzzle,
    expectedDepth: 1,
    source: 'fixed-sample',
  },
  {
    id: 'starter-line-stop',
    title: 'Starter Line Stop',
    description: 'A short sample where the target robot stops against another robot.',
    board: sampleBoard,
    puzzle: samplePuzzle,
    expectedDepth: 1,
    source: 'classic-sample',
  },
  {
    id: 'modular-edge-stop',
    title: 'Modular Edge Stop',
    description: 'A modular board sample using the generated center block and edge stopper layout.',
    board: sampleModularBoard,
    puzzle: modularPuzzle,
    expectedDepth: 1,
    source: 'modular-sample',
  },
];

export function getSamplePuzzleById(
  id: SamplePuzzleId
): SamplePuzzleDefinition | undefined {
  return samplePuzzles.find((sample) => sample.id === id);
}
