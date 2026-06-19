import type { SearchProgress } from '../features/puzzle/types';

type SearchProgressPanelProps = {
  progress: SearchProgress | null;
  isSolving?: boolean;
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

export function SearchProgressPanel({ progress, isSolving = false }: SearchProgressPanelProps) {
  if (!progress) {
    return (
      <section className="rounded border border-slate-300 bg-white p-4 text-sm shadow-sm">
        <h2 className="text-base font-semibold">BFS Search Explorer</h2>
        <p className="mt-2 text-slate-600">
          Solve를 누르면 컴퓨터가 같은 move 수의 상태를 한 층씩 넓혀 가며 탐색하는 과정이
          여기에 표시됩니다.
        </p>
        <div className="mt-3 rounded bg-slate-50 p-3 text-xs text-slate-600">
          보드의 heatmap은 목표 로봇이 탐색 중 방문한 위치를 보여주고, 진한 칸은 최근
          처리된 상태를 뜻합니다.
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

  return (
    <section className="rounded border border-slate-300 bg-white p-4 text-sm shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">BFS Search Explorer</h2>
          <p className="mt-1 text-xs text-slate-500">
            같은 depth의 모든 상태를 처리한 뒤 다음 move 수로 확장합니다.
          </p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {displayStatus}
        </span>
      </div>

      {isStaleRunningProgress ? (
        <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          현재 worker는 실행 중이 아닙니다. 아래 값은 마지막으로 받은 BFS 진행 상태입니다.
          다시 보려면 Solve를 눌러 새 탐색을 시작하세요.
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

      <div className="mt-3 grid grid-cols-2 gap-2">
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
        <div className="rounded bg-slate-50 p-2">
          <div className="text-xs text-slate-500">Elapsed</div>
          <div className="font-semibold">{formatElapsed(progress.elapsedMs)}</div>
        </div>
        <div className="rounded bg-slate-50 p-2">
          <div className="text-xs text-slate-500">Speed</div>
          <div className="font-semibold">
            {(progress.statesPerSecond ?? 0).toLocaleString()} states/s
          </div>
        </div>
        <div className="rounded bg-slate-50 p-2">
          <div className="text-xs text-slate-500">Peak Layer</div>
          <div className="font-semibold">
            {mostVisitedDepth
              ? `Depth ${mostVisitedDepth.depth} (${mostVisitedDepth.count.toLocaleString()})`
              : '-'}
          </div>
        </div>
      </div>

      <p className="mt-3 text-slate-600">
        {progress.message ?? `Depth ${progress.depth} 탐색 중`}
      </p>
      <div className="mt-3 grid gap-2 text-xs text-slate-600">
        <div className="rounded bg-amber-50 p-2">
          Heatmap: 목표 로봇이 많이 등장한 칸일수록 더 진하게 표시됩니다.
        </div>
        <div className="rounded bg-orange-50 p-2">
          Recent cells: 방금 처리한 탐색 상태의 목표 로봇 위치가 더 강하게 표시됩니다.
        </div>
      </div>

      {visibleDepthCounts.length > 0 ? (
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
            Depth Layers
          </div>
          <div className="space-y-2">
            {visibleDepthCounts.map(({ depth, count }) => {
              const widthPercent =
                maxVisibleDepthCount > 0 ? Math.max(4, (count / maxVisibleDepthCount) * 100) : 0;

              return (
                <div key={depth} className="grid grid-cols-[64px_minmax(0,1fr)_72px] items-center gap-2">
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
    </section>
  );
}
