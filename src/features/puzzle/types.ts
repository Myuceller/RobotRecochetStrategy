export type TargetRobotColor = 'red' | 'blue' | 'yellow' | 'green';

export type RobotColor = TargetRobotColor | 'black';

export type Direction = 'up' | 'right' | 'down' | 'left';

export type CellIndex = number;

export type Position = {
  row: number;
  col: number;
};

export type CellWalls = {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};

export type Board = {
  width: number;
  height: number;
  walls: CellWalls[];
};

export type RobotState = Record<RobotColor, CellIndex>;

export type PuzzleState = {
  robots: RobotState;
  targetRobot: TargetRobotColor;
  targetCell: CellIndex;
  targetId?: number;
};

export type Move = {
  robot: RobotColor;
  direction: Direction;
  from: CellIndex;
  to: CellIndex;
};

export type ParentEntry = {
  prevKey: string;
  move: Move;
};

export type SolveOptions = {
  maxVisited?: number;
  maxDepth?: number;
  maxQueueSize?: number;
};

export type SolveResult = {
  found: boolean;
  moves: Move[];
  visitedCount: number;
  depth: number;
  reason?: 'solved' | 'maxVisited' | 'maxDepth' | 'maxQueueSize' | 'notFound' | 'cancelled';
};

export type SearchStatus =
  | 'idle'
  | 'running'
  | 'solved'
  | 'maxVisited'
  | 'maxDepth'
  | 'maxQueueSize'
  | 'notFound'
  | 'cancelled';

export type SearchProgress = {
  status: SearchStatus;
  visitedCount: number;
  depth: number;
  frontierSize: number;
  elapsedMs: number;
  sampledCells: CellIndex[];
  heatmap: number[];
  currentRobots?: RobotState;
  currentMove?: Move;
  recentMoves?: Move[];
  depthCounts?: Record<number, number>;
  statesPerSecond?: number;
  maxHeat?: number;
  message?: string;
};

export type ProgressSolveOptions = SolveOptions & {
  chunkSize?: number;
  progressInterval?: number;
  signal?: AbortSignal;
  onProgress?: (progress: SearchProgress) => void;
};
