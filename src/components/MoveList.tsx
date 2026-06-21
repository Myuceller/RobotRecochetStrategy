import { toPosition } from '../features/puzzle/board';
import type { Board, Move, SolveResult } from '../features/puzzle/types';

type MoveListProps = {
  board: Board;
  result: SolveResult | null;
  stepIndex: number;
};

function formatCell(index: Move['from'], board: Board): string {
  const position = toPosition(index, board);

  return `cell ${index} (${position.row}, ${position.col})`;
}

export function MoveList({ board, result, stepIndex }: MoveListProps) {
  if (!result || result.moves.length === 0) {
    return null;
  }

  return (
    <ol className="mt-4 max-h-[420px] space-y-2 overflow-auto text-sm">
      {result.moves.map((move, index) => {
        const isActive = index === stepIndex - 1;

        return (
          <li
            key={`${move.robot}-${move.direction}-${index}-${move.from}-${move.to}`}
            className={`rounded border p-2 ${
              isActive
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            <div className="font-medium">
              {index + 1}. {move.robot} → {move.direction}
            </div>
            <div className={`mt-1 text-xs ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
              {formatCell(move.from, board)} to {formatCell(move.to, board)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
