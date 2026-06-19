import type { Dispatch, SetStateAction } from 'react';
import type { Board, SolveResult } from '../features/puzzle/types';
import { MoveList } from './MoveList';
import { PlaybackControls, type PlaybackSpeed } from './PlaybackControls';

type SolutionPanelProps = {
  board: Board;
  result: SolveResult | null;
  stepIndex: number;
  setStepIndex: Dispatch<SetStateAction<number>>;
  onSolve: () => void;
  onCancel: () => void;
  isSolving: boolean;
  isSolveDisabled?: boolean;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onPlay: () => void;
  onPause: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
};

function getFailureText(reason: SolveResult['reason']): { title: string; detail: string } {
  switch (reason) {
    case 'maxDepth':
      return {
        title: '답을 찾지 못했습니다',
        detail: '설정된 최대 move 깊이까지 탐색했지만 목표에 도달하지 못했습니다.',
      };
    case 'maxVisited':
      return {
        title: '답을 찾지 못했습니다',
        detail: '방문 상태 수 제한에 도달해서 탐색을 중단했습니다.',
      };
    case 'maxQueueSize':
      return {
        title: '답을 찾지 못했습니다',
        detail: '대기 중인 탐색 상태가 너무 많아져서 탐색을 중단했습니다.',
      };
    case 'notFound':
      return {
        title: '답이 없는 퍼즐일 수 있습니다',
        detail: '가능한 상태를 모두 탐색했지만 목표에 도달하지 못했습니다.',
      };
    case 'cancelled':
      return {
        title: '탐색이 중단되었습니다',
        detail: '사용자가 Stop을 눌렀거나 새 작업이 시작되어 탐색이 취소되었습니다.',
      };
    default:
      return {
        title: '답을 찾지 못했습니다',
        detail: '탐색이 실패했습니다. 목표 위치나 벽 배치를 확인하세요.',
      };
  }
}

export function SolutionPanel({
  board,
  result,
  stepIndex,
  setStepIndex,
  onSolve,
  onCancel,
  isSolving,
  isSolveDisabled = false,
  isPlaying,
  playbackSpeed,
  onPlay,
  onPause,
  onSpeedChange,
}: SolutionPanelProps) {
  const moveCount = result?.moves.length ?? 0;
  const failureText = result && !result.found ? getFailureText(result.reason) : null;

  return (
    <aside className="rounded border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Run BFS</h2>
          <p className="text-sm text-slate-600">
            Step {stepIndex} / {moveCount}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSolve}
            disabled={isSolving || isSolveDisabled}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSolving ? 'Running...' : 'Solve'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={!isSolving}
            className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Stop
          </button>
        </div>
      </div>

      <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-3 text-sm">
        {isSolving ? (
          <p className="text-slate-600">
            BFS가 상태를 하나씩 꺼내 보드에 표시하는 중입니다.
          </p>
        ) : !result ? (
          <p className="text-slate-600">Solve를 누르면 탐색 과정이 보드와 BFS 패널에 표시됩니다.</p>
        ) : result.found ? (
          <div className="space-y-1">
            <p className="font-semibold">최단 경로 {result.moves.length} moves</p>
            <p>Visited states: {result.visitedCount}</p>
            <p>Depth: {result.depth}</p>
            <p>Reason: {result.reason}</p>
          </div>
        ) : (
          <div className="space-y-2 rounded border border-red-200 bg-red-50 p-3 text-red-800">
            <p className="font-semibold">{failureText?.title}</p>
            <p className="text-xs">{failureText?.detail}</p>
            <p>Visited states: {result.visitedCount}</p>
            <p>Depth: {result.depth}</p>
            <p>Reason: {result.reason}</p>
          </div>
        )}
      </div>

      <PlaybackControls
        moveCount={moveCount}
        stepIndex={stepIndex}
        setStepIndex={setStepIndex}
        hasResult={Boolean(result)}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onPlay={onPlay}
        onPause={onPause}
        onSpeedChange={onSpeedChange}
      />

      <MoveList board={board} result={result} stepIndex={stepIndex} />
    </aside>
  );
}
