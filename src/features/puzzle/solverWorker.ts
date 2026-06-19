import { solvePuzzleWithProgress } from './progressSolver';
import type { SolverWorkerRequest, SolverWorkerResponse } from './workerTypes';

type WorkerScope = {
  postMessage: (message: SolverWorkerResponse) => void;
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<SolverWorkerRequest>) => void
  ) => void;
};

const workerScope = self as unknown as WorkerScope;

let activeController: AbortController | null = null;
let activeId: string | null = null;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown worker error';
}

async function runSolve(message: Extract<SolverWorkerRequest, { type: 'start' }>): Promise<void> {
  activeController?.abort();

  const controller = new AbortController();
  activeController = controller;
  activeId = message.id;

  try {
    const result = await solvePuzzleWithProgress(message.board, message.puzzle, {
      ...message.options,
      signal: controller.signal,
      onProgress: (progress) => {
        workerScope.postMessage({
          type: 'progress',
          id: message.id,
          progress,
        });
      },
    });

    workerScope.postMessage({
      type: 'result',
      id: message.id,
      result,
    });
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      id: message.id,
      message: toErrorMessage(error),
    });
  } finally {
    if (activeId === message.id) {
      activeController = null;
      activeId = null;
    }
  }
}

workerScope.addEventListener('message', (event) => {
  const message = event.data;

  if (message.type === 'cancel') {
    if (activeId === message.id) {
      activeController?.abort();
    }

    return;
  }

  void runSolve(message);
});
