import { generateSolvablePuzzle, type PhotoTargetToken } from './randomPuzzle';
import type { Board, PuzzleState } from './types';

export type SamplePuzzleId = string;

export type SamplePuzzleDefinition = {
  id: SamplePuzzleId;
  title: string;
  description: string;
  board: Board;
  puzzle: PuzzleState;
  targetTokens?: PhotoTargetToken[];
  expectedDepth?: number;
  source: 'photo-quadrant-sample';
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

export const samplePuzzles: SamplePuzzleDefinition[] = [
  {
    id: 'photo-quadrant-generated',
    title: 'Photo Quadrant Sample',
    description: 'A solver-validated sample built from the 8x8 quadrant composition system.',
    board: photoQuadrantSample.board,
    puzzle: photoQuadrantSample.puzzle,
    targetTokens: photoQuadrantSample.targetTokens,
    expectedDepth: photoQuadrantSample.solution.depth,
    source: 'photo-quadrant-sample',
  },
];

export function getSamplePuzzleById(
  id: SamplePuzzleId
): SamplePuzzleDefinition | undefined {
  return samplePuzzles.find((sample) => sample.id === id);
}
