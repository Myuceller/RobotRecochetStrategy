import { encodeState } from './encode';
import { applyMove, generateMoves } from './movement';
import type {
  Board,
  Move,
  ParentEntry,
  PuzzleState,
  RobotState,
  SolveOptions,
  SolveResult,
} from './types';

const DEFAULT_MAX_VISITED = 100_000;
const DEFAULT_MAX_DEPTH = 50;
const DEFAULT_MAX_QUEUE_SIZE = 100_000;

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

export function solvePuzzle(
  board: Board,
  puzzle: PuzzleState,
  options: SolveOptions = {}
): SolveResult {
  const maxVisited = options.maxVisited ?? DEFAULT_MAX_VISITED;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxQueueSize = options.maxQueueSize ?? DEFAULT_MAX_QUEUE_SIZE;
  const startRobots = puzzle.robots;
  const startKey = encodeState(startRobots);

  if (startRobots[puzzle.targetRobot] === puzzle.targetCell) {
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

  const visited = new Set<string>([startKey]);
  const stateMap = new Map<string, RobotState>([[startKey, startRobots]]);
  const parentMap = new Map<string, ParentEntry>();
  const depthMap = new Map<string, number>([[startKey, 0]]);

  while (head < queue.length) {
    const currentKey = queue[head];
    head += 1;

    const currentRobots = stateMap.get(currentKey);
    const currentDepth = depthMap.get(currentKey) ?? 0;
    deepestDepth = Math.max(deepestDepth, currentDepth);

    if (!currentRobots) {
      continue;
    }

    if (currentDepth >= maxDepth) {
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
      deepestDepth = Math.max(deepestDepth, nextDepth);

      if (visited.size > maxVisited) {
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
        return {
          found: false,
          moves: [],
          visitedCount: visited.size,
          depth: nextDepth,
          reason: 'maxQueueSize',
        };
      }
    }
  }

  return {
    found: false,
    moves: [],
    visitedCount: visited.size,
    depth: deepestDepth,
    reason: 'notFound',
  };
}
