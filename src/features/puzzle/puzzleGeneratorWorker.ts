import { generateSolvablePuzzle } from './randomPuzzle';
import { sampleModules } from './sampleModules';
import type {
  PuzzleGeneratorWorkerRequest,
  PuzzleGeneratorWorkerResponse,
} from './puzzleGeneratorWorkerTypes';

type WorkerScope = {
  postMessage: (message: PuzzleGeneratorWorkerResponse) => void;
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<PuzzleGeneratorWorkerRequest>) => void
  ) => void;
};

const workerScope = self as unknown as WorkerScope;
const cancelledRequestIds = new Set<string>();

let activeId: string | null = null;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown puzzle generation error';
}

function postCancelled(id: string): void {
  workerScope.postMessage({
    type: 'cancelled',
    id,
  });
}

function runGeneration(message: Extract<PuzzleGeneratorWorkerRequest, { type: 'generate' }>): void {
  activeId = message.id;
  cancelledRequestIds.delete(message.id);

  if (cancelledRequestIds.has(message.id)) {
    postCancelled(message.id);
    activeId = null;
    return;
  }

  try {
    const result = generateSolvablePuzzle({
      modules: sampleModules,
      ...message.options,
    });

    if (cancelledRequestIds.has(message.id)) {
      postCancelled(message.id);
      return;
    }

    workerScope.postMessage({
      type: 'result',
      id: message.id,
      result,
    });
  } catch (error) {
    if (cancelledRequestIds.has(message.id)) {
      postCancelled(message.id);
      return;
    }

    workerScope.postMessage({
      type: 'error',
      id: message.id,
      message: toErrorMessage(error),
    });
  } finally {
    cancelledRequestIds.delete(message.id);

    if (activeId === message.id) {
      activeId = null;
    }
  }
}

workerScope.addEventListener('message', (event) => {
  const message = event.data;

  if (message.type === 'cancel') {
    cancelledRequestIds.add(message.id);

    if (activeId === message.id) {
      postCancelled(message.id);
    }

    return;
  }

  runGeneration(message);
});
