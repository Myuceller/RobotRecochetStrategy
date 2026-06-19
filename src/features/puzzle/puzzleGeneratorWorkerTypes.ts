import type { RandomPuzzleDifficulty, RandomPuzzleResult } from './randomPuzzle';

export type PuzzleGeneratorWorkerRequest =
  | {
      type: 'generate';
      id: string;
      options: {
        maxAttempts?: number;
        solveMaxVisited?: number;
        solveMaxDepth?: number;
        difficulty?: RandomPuzzleDifficulty;
        allowRotation?: boolean;
      };
    }
  | {
      type: 'cancel';
      id: string;
    };

export type PuzzleGeneratorWorkerResponse =
  | {
      type: 'result';
      id: string;
      result: RandomPuzzleResult;
    }
  | {
      type: 'error';
      id: string;
      message: string;
    }
  | {
      type: 'cancelled';
      id: string;
    };
