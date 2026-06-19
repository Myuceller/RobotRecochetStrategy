import { encodeState } from './encode';
import { applyMove, generateMoves } from './movement';
import type {
  Board,
  CellIndex,
  Move,
  ParentEntry,
  ProgressSolveOptions,
  PuzzleState,
  RobotState,
  SearchProgress,
  SearchStatus,
  SolveResult,
} from './types';

const DEFAULT_MAX_VISITED = 100_000;
const DEFAULT_MAX_DEPTH = 50;
const DEFAULT_MAX_QUEUE_SIZE = 100_000;
const DEFAULT_CHUNK_SIZE = 1_000;
const DEFAULT_PROGRESS_INTERVAL = 1_000;
const MAX_SAMPLED_CELLS = 50;

function reconstructPath(
  parentMap: Map<string, ParentEntry>,
  goalKey: string
): Move[] {
  const moves: Move[] = [];
  let currentKey = goalKey;

  while (true) {
    const entry = parentMap.get(currentKey);

    if (!entry) {
      break;
    }

    moves.push(entry.move);
    currentKey = entry.prevKey;
  }

  return moves.reverse();
}

function nowMs(): number {
  return performance.now();
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => resolve());
      return;
    }

    setTimeout(resolve, 0);
  });
}

function createProgress(
  status: SearchStatus,
  visitedCount: number,
  depth: number,
  frontierSize: number,
  startedAt: number,
  heatmap: number[],
  sampledCells: CellIndex[],
  depthCounts: Record<number, number>,
  message?: string
): SearchProgress {
  const elapsedMs = Math.round(nowMs() - startedAt);
  const elapsedSeconds = elapsedMs / 1000;
  const statesPerSecond = elapsedSeconds > 0 ? Math.round(visitedCount / elapsedSeconds) : visitedCount;
  const maxHeat = heatmap.reduce((max, value) => Math.max(max, value), 0);

  return {
    status,
    visitedCount,
    depth,
    frontierSize,
    elapsedMs,
    sampledCells: [...sampledCells],
    heatmap: [...heatmap],
    depthCounts: { ...depthCounts },
    statesPerSecond,
    maxHeat,
    message,
  };
}

function pushSample(sampledCells: CellIndex[], cell: CellIndex): void {
  sampledCells.push(cell);

  if (sampledCells.length > MAX_SAMPLED_CELLS) {
    sampledCells.splice(0, sampledCells.length - MAX_SAMPLED_CELLS);
  }
}

export async function solvePuzzleWithProgress(
  board: Board,
  puzzle: PuzzleState,
  options: ProgressSolveOptions = {}
): Promise<SolveResult> {
  const maxVisited = options.maxVisited ?? DEFAULT_MAX_VISITED;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxQueueSize = options.maxQueueSize ?? DEFAULT_MAX_QUEUE_SIZE;
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const progressInterval = options.progressInterval ?? DEFAULT_PROGRESS_INTERVAL;
  const heatmap = Array.from({ length: board.width * board.height }, () => 0);
  const sampledCells: CellIndex[] = [];
  const depthCounts: Record<number, number> = {};
  const startedAt = nowMs();

  const emitProgress = (
    status: SearchStatus,
    visitedCount: number,
    depth: number,
    frontierSize: number,
    message?: string
  ) => {
    options.onProgress?.(
      createProgress(
        status,
        visitedCount,
        depth,
        frontierSize,
        startedAt,
        heatmap,
        sampledCells,
        depthCounts,
        message
      )
    );
  };

  const startRobots = puzzle.robots;
  const startKey = encodeState(startRobots);
  const startCell = startRobots[puzzle.targetRobot];

  heatmap[startCell] += 1;
  depthCounts[0] = 1;
  pushSample(sampledCells, startCell);

  if (startRobots[puzzle.targetRobot] === puzzle.targetCell) {
    emitProgress('solved', 1, 0, 0, 'Start state is already solved.');

    return {
      found: true,
      moves: [],
      visitedCount: 1,
      depth: 0,
      reason: 'solved',
    };
  }

  const queue: string[] = [startKey];
  let head = 0;
  let deepestDepth = 0;
  let processedCount = 0;

  const visited = new Set<string>([startKey]);
  const stateMap = new Map<string, RobotState>([[startKey, startRobots]]);
  const parentMap = new Map<string, ParentEntry>();
  const depthMap = new Map<string, number>([[startKey, 0]]);

  emitProgress('running', visited.size, 0, queue.length - head, 'Depth 0 탐색 중');

  while (head < queue.length) {
    if (options.signal?.aborted) {
      emitProgress('cancelled', visited.size, deepestDepth, queue.length - head, 'Search cancelled.');

      return {
        found: false,
        moves: [],
        visitedCount: visited.size,
        depth: deepestDepth,
        reason: 'cancelled',
      };
    }

    const currentKey = queue[head];
    head += 1;
    processedCount += 1;

    const currentRobots = stateMap.get(currentKey);
    const currentDepth = depthMap.get(currentKey) ?? 0;
    deepestDepth = Math.max(deepestDepth, currentDepth);

    if (!currentRobots) {
      continue;
    }

    const currentTargetCell = currentRobots[puzzle.targetRobot];
    heatmap[currentTargetCell] += 1;
    pushSample(sampledCells, currentTargetCell);

    if (processedCount % progressInterval === 0) {
      emitProgress(
        'running',
        visited.size,
        currentDepth,
        queue.length - head,
        `Depth ${currentDepth} 탐색 중`
      );
    }

    if (currentDepth >= maxDepth) {
      emitProgress('maxDepth', visited.size, currentDepth, queue.length - head, 'Depth limit reached.');

      return {
        found: false,
        moves: [],
        visitedCount: visited.size,
        depth: currentDepth,
        reason: 'maxDepth',
      };
    }

    const moves = generateMoves(board, currentRobots);

    for (const move of moves) {
      const nextRobots = applyMove(currentRobots, move);
      const nextKey = encodeState(nextRobots);

      if (visited.has(nextKey)) {
        continue;
      }

      visited.add(nextKey);
      stateMap.set(nextKey, nextRobots);
      parentMap.set(nextKey, {
        prevKey: currentKey,
        move,
      });

      const nextDepth = currentDepth + 1;
      depthMap.set(nextKey, nextDepth);
      depthCounts[nextDepth] = (depthCounts[nextDepth] ?? 0) + 1;
      deepestDepth = Math.max(deepestDepth, nextDepth);

      if (visited.size > maxVisited) {
        emitProgress(
          'maxVisited',
          visited.size,
          nextDepth,
          queue.length - head,
          'Visited state limit reached.'
        );

        return {
          found: false,
          moves: [],
          visitedCount: visited.size,
          depth: nextDepth,
          reason: 'maxVisited',
        };
      }

      if (nextRobots[puzzle.targetRobot] === puzzle.targetCell) {
        const solutionMoves = reconstructPath(parentMap, nextKey);
        const goalCell = nextRobots[puzzle.targetRobot];

        heatmap[goalCell] += 1;
        pushSample(sampledCells, goalCell);
        emitProgress('solved', visited.size, solutionMoves.length, queue.length - head, 'Solved.');

        return {
          found: true,
          moves: solutionMoves,
          visitedCount: visited.size,
          depth: solutionMoves.length,
          reason: 'solved',
        };
      }

      queue.push(nextKey);

      if (queue.length - head > maxQueueSize) {
        emitProgress(
          'maxQueueSize',
          visited.size,
          nextDepth,
          queue.length - head,
          'Queue size limit reached.'
        );

        return {
          found: false,
          moves: [],
          visitedCount: visited.size,
          depth: nextDepth,
          reason: 'maxQueueSize',
        };
      }
    }

    if (processedCount % chunkSize === 0) {
      await yieldToBrowser();
    }
  }

  emitProgress('notFound', visited.size, deepestDepth, 0, 'No solution found.');

  return {
    found: false,
    moves: [],
    visitedCount: visited.size,
    depth: deepestDepth,
    reason: 'notFound',
  };
}
