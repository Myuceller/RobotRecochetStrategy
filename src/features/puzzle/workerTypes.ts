import type { Board, PuzzleState, SearchProgress, SolveResult } from './types';

export type SolverWorkerOptions = {
  maxVisited?: number;
  maxDepth?: number;
  maxQueueSize?: number;
  chunkSize?: number;
  progressInterval?: number;
};

export type SolverWorkerRequest =
  | {
      type: 'start';
      id: string;
      board: Board;
      puzzle: PuzzleState;
      options?: SolverWorkerOptions;
    }
  | {
      type: 'cancel';
      id: string;
    };

export type SolverWorkerResponse =
  | {
      type: 'progress';
      id: string;
      progress: SearchProgress;
    }
  | {
      type: 'result';
      id: string;
      result: SolveResult;
    }
  | {
      type: 'error';
      id: string;
      message: string;
    };
