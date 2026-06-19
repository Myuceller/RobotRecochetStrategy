import { getCellWalls, isCenterBlockedCell } from '../features/puzzle/board';
import type { Board, CellIndex, RobotColor, RobotState } from '../features/puzzle/types';
import type { MovePath } from '../features/puzzle/playback';
import { BoardCell } from './BoardCell';
import { RobotToken } from './RobotToken';
import { TargetMarker } from './TargetMarker';

const ROBOT_ORDER: RobotColor[] = ['red', 'blue', 'yellow', 'green'];

type BoardViewProps = {
  board: Board;
  robots: RobotState;
  targetRobot: RobotColor;
  targetCell: CellIndex;
  heatmap?: number[];
  sampledCells?: CellIndex[];
  maxHeat?: number;
  currentMovePath?: MovePath | null;
  activeMoveRobot?: RobotColor | null;
  editable?: boolean;
  isCellEditable?: (cell: CellIndex) => boolean;
  onCellClick?: (cell: CellIndex) => void;
};

function getRobotAt(robots: RobotState, index: CellIndex): RobotColor | null {
  for (const robot of ROBOT_ORDER) {
    if (robots[robot] === index) {
      return robot;
    }
  }

  return null;
}

export function BoardView({
  board,
  robots,
  targetRobot,
  targetCell,
  heatmap,
  sampledCells,
  maxHeat,
  currentMovePath,
  activeMoveRobot,
  editable = false,
  isCellEditable,
  onCellClick,
}: BoardViewProps) {
  const cells = Array.from({ length: board.width * board.height }, (_, index) => index);
  const recentCells = new Set(sampledCells ?? []);
  const pathCells = new Set(currentMovePath?.cells ?? []);
  const normalizedMaxHeat = maxHeat ?? heatmap?.reduce((max, value) => Math.max(max, value), 0) ?? 0;

  return (
    <div className="flex w-full justify-center overflow-hidden pb-2">
      <div
        className="grid aspect-square w-[min(92vw,calc(100vh-190px),680px)] max-w-full overflow-hidden rounded border-2 border-slate-800 bg-white shadow-sm"
        style={{
          gridTemplateColumns: `repeat(${board.width}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${board.height}, minmax(0, 1fr))`,
        }}
      >
        {cells.map((index) => {
          const cellIndex = index as CellIndex;
          const isBlocked = isCenterBlockedCell(board, cellIndex);
          const robot = isBlocked ? null : getRobotAt(robots, cellIndex);
          const isTarget = !isBlocked && cellIndex === targetCell;
          const pathRole =
            currentMovePath && cellIndex === currentMovePath.from
              ? 'from'
              : currentMovePath && cellIndex === currentMovePath.to
                ? 'to'
                : pathCells.has(cellIndex)
                  ? 'path'
                  : null;
          const canEditCell = editable && !isBlocked && (isCellEditable?.(cellIndex) ?? true);

          return (
            <BoardCell
              key={cellIndex}
              walls={getCellWalls(board, cellIndex)}
              heat={heatmap?.[cellIndex] ?? 0}
              maxHeat={normalizedMaxHeat}
              isSampled={recentCells.has(cellIndex)}
              isBlocked={isBlocked}
              isEditing={editable}
              editable={canEditCell}
              pathRole={pathRole}
              onClick={canEditCell && onCellClick ? () => onCellClick(cellIndex) : undefined}
            >
              {isTarget ? <TargetMarker robot={targetRobot} /> : null}
              {robot ? <RobotToken robot={robot} isActive={robot === activeMoveRobot} /> : null}
            </BoardCell>
          );
        })}
      </div>
    </div>
  );
}
