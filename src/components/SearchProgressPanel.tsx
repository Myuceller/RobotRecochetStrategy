import type { SearchProgress } from '../features/puzzle/types';

type SearchPlaybackSpeed = 120 | 80 | 40 | 16;

type SearchProgressPanelProps = {
  progress: SearchProgress | null;
  isSolving?: boolean;
  currentMove?: SearchProgress['currentMove'];
  frameQueueSize?: number;
  receivedFrameCount?: number;
  displayedFrameCount?: number;
  droppedFrameCount?: number;
  playbackSpeed?: SearchPlaybackSpeed;
  onPlaybackSpeedChange?: (speed: SearchPlaybackSpeed) => void;
  canReplay?: boolean;
  replayFrameCount?: number;
  onReplay?: () => void;
  isShowingProof?: boolean;
  proofMove?: SearchProgress['currentMove'];
  proofStep?: number;
  proofTotal?: number;
  proofFrameCount?: number;
  canReplayProof?: boolean;
  onReplayProof?: () => void;
};

function formatElapsed(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  return `${(ms / 1000).toFixed(1)}s`;
}

function getMostVisitedDepth(depthCounts: Record<number, number> | undefined): {
  depth: number;
  count: number;
} | null {
  const entries = Object.entries(depthCounts ?? {});

  if (entries.length === 0) {
    return null;
  }

  return entries.reduce(
    (best, [depth, count]) => {
      const parsedDepth = Number(depth);

      return count > best.count ? { depth: parsedDepth, count } : best;
    },
    { depth: 0, count: 0 }
  );
}

function getVisibleDepthCounts(
  depthCounts: Record<number, number> | undefined,
  currentDepth: number
): Array<{ depth: number; count: number }> {
  const entries = Object.entries(depthCounts ?? {}).map(([depth, count]) => ({
    depth: Number(depth),
    count,
  }));

  if (entries.length <= 8) {
    return entries.sort((a, b) => a.depth - b.depth);
  }

  const recent = entries
    .filter(({ depth }) => depth >= Math.max(0, currentDepth - 7) && depth <= currentDepth)
    .sort((a, b) => a.depth - b.depth);

  if (recent.length > 0) {
    return recent.slice(-8);
  }

  return entries.sort((a, b) => b.count - a.count).slice(0, 8).sort((a, b) => a.depth - b.depth);
}

function getTerminalNotice(status: SearchProgress['status']): string | null {
  switch (status) {
    case 'solved':
      return '답을 찾았습니다. 오른쪽 Solution 패널에서 최단 경로를 재생할 수 있습니다.';
    case 'notFound':
      return '답을 찾지 못했습니다. 가능한 상태를 모두 확인했지만 목표에 도달하지 못했습니다.';
    case 'maxDepth':
      return '답을 찾지 못했습니다. 최대 depth 제한에 걸려 탐색을 중단했습니다.';
    case 'maxVisited':
      return '답을 찾지 못했습니다. 방문 상태 수 제한에 걸려 탐색을 중단했습니다.';
    case 'maxQueueSize':
      return '답을 찾지 못했습니다. 대기 중인 탐색 상태가 너무 많아져 탐색을 중단했습니다.';
    case 'cancelled':
      return '탐색이 중단되었습니다.';
    default:
      return null;
  }
}

function formatMoveCell(cell: number): string {
  return `#${cell}`;
}

function formatMove(move: NonNullable<SearchProgress['currentMove']>): string {
  return `${move.robot} ${move.direction} ${formatMoveCell(move.from)} -> ${formatMoveCell(move.to)}`;
}

export function SearchProgressPanel({
  progress,
  isSolving = false,
  currentMove,
  frameQueueSize = 0,
  receivedFrameCount = 0,
  displayedFrameCount = 0,
  droppedFrameCount = 0,
  playbackSpeed = 80,
  onPlaybackSpeedChange,
  canReplay = false,
  replayFrameCount = 0,
  onReplay,
  isShowingProof = false,
  proofMove,
  proofStep = 0,
  proofTotal = 0,
  proofFrameCount = 0,
  canReplayProof = false,
  onReplayProof,
}: SearchProgressPanelProps) {
  const playbackSpeeds: Array<{ value: SearchPlaybackSpeed; label: string }> = [
    { value: 120, label: 'slow' },
    { value: 80, label: 'normal' },
    { value: 40, label: 'fast' },
    { value: 16, label: 'turbo' },
  ];

  if (!progress) {
    return (
      <section className="rounded border border-slate-300 bg-white p-4 text-sm shadow-sm">
        <h2 className="text-base font-semibold">Search and Proof</h2>
        <p className="mt-2 text-slate-600">
          Use Find Answer for speed, or Watch BFS to record candidate attempts.
        </p>
        <div className="mt-3 rounded bg-slate-50 p-3 text-xs text-slate-600">
          Use Replay BFS for the broad search, and Replay Proof for the actual solution chain.
        </div>
      </section>
    );
  }

  const visibleDepthCounts = getVisibleDepthCounts(progress.depthCounts, progress.depth);
  const maxVisibleDepthCount = visibleDepthCounts.reduce(
    (max, { count }) => Math.max(max, count),
    0
  );
  const mostVisitedDepth = getMostVisitedDepth(progress.depthCounts);
  const isStaleRunningProgress = progress.status === 'running' && !isSolving;
  const displayStatus = isStaleRunningProgress ? 'stopped' : progress.status;
  const terminalNotice = getTerminalNotice(progress.status);
  const displayMove = currentMove ?? progress.currentMove;

  return (
    <section className="rounded border border-slate-300 bg-white p-4 text-sm shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Search and Proof</h2>
          <p className="mt-1 text-xs text-slate-500">
            BFS searches candidates. Proof replay shows the exact answer branch.
          </p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {displayStatus}
        </span>
      </div>

      {isStaleRunningProgress ? (
        <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          탐색 worker가 멈춘 상태입니다. 아래 값은 마지막으로 받은 BFS 상태입니다.
        </div>
      ) : null}

      {terminalNotice ? (
        <div
          className={`mt-3 rounded border p-3 text-xs ${
            progress.status === 'solved'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {terminalNotice}
        </div>
      ) : null}

      {displayMove ? (
        <div className="mt-3 rounded border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
          <div className="font-semibold">Current candidate move</div>
          <div className="mt-1 font-mono">{formatMove(displayMove)}</div>
          <div className="mt-1 text-sky-700">
            This is one candidate being checked, not necessarily the final answer.
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          시작 상태를 준비 중입니다.
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded bg-slate-50 p-2">
          <div className="text-xs text-slate-500">Visited</div>
          <div className="font-semibold">{progress.visitedCount.toLocaleString()} states</div>
        </div>
        <div className="rounded bg-slate-50 p-2">
          <div className="text-xs text-slate-500">Depth</div>
          <div className="font-semibold">{progress.depth}</div>
        </div>
        <div className="rounded bg-slate-50 p-2">
          <div className="text-xs text-slate-500">Frontier</div>
          <div className="font-semibold">{progress.frontierSize.toLocaleString()} states</div>
        </div>
      </div>

      <div className="mt-3 rounded border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">
              BFS Search Replay
            </div>
            <div className="mt-1 text-xs text-slate-600">
              Shows many attempted candidate states. Use turbo to scan the whole search quickly.
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            queue <span className="font-semibold text-slate-900">{frameQueueSize.toLocaleString()}</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
          <div className="rounded bg-slate-50 p-2">
            <div className="text-slate-500">Candidates</div>
            <div className="font-semibold">{receivedFrameCount.toLocaleString()}</div>
          </div>
          <div className="rounded bg-slate-50 p-2">
            <div className="text-slate-500">Shown</div>
            <div className="font-semibold">{displayedFrameCount.toLocaleString()}</div>
          </div>
          <div className="rounded bg-slate-50 p-2">
            <div className="text-slate-500">Dropped</div>
            <div className="font-semibold">{droppedFrameCount.toLocaleString()}</div>
          </div>
          <div className="rounded bg-slate-50 p-2">
            <div className="text-slate-500">Saved</div>
            <div className="font-semibold">{replayFrameCount.toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReplay}
            disabled={!canReplay}
            className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Replay BFS
          </button>
          <div className="grid flex-1 grid-cols-4 gap-2">
            {playbackSpeeds.map((speed) => (
              <button
                key={speed.value}
                type="button"
                onClick={() => onPlaybackSpeedChange?.(speed.value)}
                className={`rounded border px-2 py-1 text-xs font-semibold ${
                  playbackSpeed === speed.value
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {speed.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-slate-600">
        {progress.message ?? `Depth ${progress.depth} 탐색 중`}
      </p>

      <div
        className={`mt-3 rounded border p-3 ${
          isShowingProof
            ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
            : canReplayProof
              ? 'border-emerald-200 bg-white text-slate-700'
              : 'border-slate-200 bg-white text-slate-700'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">
              Answer Proof Replay
            </div>
            <div className="mt-1 text-xs">
              Shows only the shortest path reconstructed after BFS finds the goal.
            </div>
          </div>
          <button
            type="button"
            onClick={onReplayProof}
            disabled={!canReplayProof}
            className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Replay Proof
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded bg-white/70 p-2">
            <div className="text-slate-500">Step</div>
            <div className="font-semibold">
              {proofTotal > 0 ? `${proofStep} / ${proofTotal}` : '-'}
            </div>
          </div>
          <div className="rounded bg-white/70 p-2">
            <div className="text-slate-500">Frames</div>
            <div className="font-semibold">{proofFrameCount.toLocaleString()}</div>
          </div>
          <div className="rounded bg-white/70 p-2">
            <div className="text-slate-500">Status</div>
            <div className="font-semibold">{isShowingProof ? 'replaying' : 'ready'}</div>
          </div>
        </div>
        {proofMove ? (
          <div className="mt-3 rounded border border-emerald-200 bg-white/80 p-2 text-xs">
            <div className="font-semibold">Current proof move</div>
            <div className="mt-1 font-mono">{formatMove(proofMove)}</div>
          </div>
        ) : null}
      </div>

      {progress.recentMoves && progress.recentMoves.length > 0 ? (
        <div className="mt-3 rounded border border-slate-200 bg-white p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
            Recent BFS Moves
          </div>
          <div className="max-h-36 space-y-1 overflow-hidden text-xs text-slate-700">
            {progress.recentMoves.slice(-8).map((move, index) => (
              <div
                key={`${move.robot}-${move.direction}-${move.from}-${move.to}-${index}`}
                className="grid grid-cols-[22px_minmax(0,1fr)] gap-2 rounded bg-slate-50 px-2 py-1"
              >
                <span className="text-right text-slate-400">
                  {Math.max(1, (progress.recentMoves?.length ?? 0) - 7 + index)}
                </span>
                <span className="font-mono">{formatMove(move)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <details className="mt-3 rounded border border-slate-200 bg-white">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
          Search stats
        </summary>
        <div className="border-t border-slate-200 p-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded bg-slate-50 p-2">
              <div className="text-slate-500">Elapsed</div>
              <div className="font-semibold">{formatElapsed(progress.elapsedMs)}</div>
            </div>
            <div className="rounded bg-slate-50 p-2">
              <div className="text-slate-500">Speed</div>
              <div className="font-semibold">
                {(progress.statesPerSecond ?? 0).toLocaleString()} states/s
              </div>
            </div>
            <div className="rounded bg-slate-50 p-2">
              <div className="text-slate-500">Peak Layer</div>
              <div className="font-semibold">
                {mostVisitedDepth
                  ? `Depth ${mostVisitedDepth.depth} (${mostVisitedDepth.count.toLocaleString()})`
                  : '-'}
              </div>
            </div>
            <div className="rounded bg-slate-50 p-2">
              <div className="text-slate-500">Heat Max</div>
              <div className="font-semibold">{progress.maxHeat ?? 0}</div>
            </div>
          </div>

          {visibleDepthCounts.length > 0 ? (
            <div className="mt-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
                Depth Layers
              </div>
              <div className="space-y-2">
                {visibleDepthCounts.map(({ depth, count }) => {
                  const widthPercent =
                    maxVisibleDepthCount > 0
                      ? Math.max(4, (count / maxVisibleDepthCount) * 100)
                      : 0;

                  return (
                    <div
                      key={depth}
                      className="grid grid-cols-[64px_minmax(0,1fr)_72px] items-center gap-2"
                    >
                      <div className="text-xs text-slate-600">Depth {depth}</div>
                      <div className="h-2 overflow-hidden rounded bg-slate-100">
                        <div
                          className="h-full rounded bg-slate-700"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                      <div className="text-right text-xs tabular-nums text-slate-600">
                        {count.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </details>
    </section>
  );
}
