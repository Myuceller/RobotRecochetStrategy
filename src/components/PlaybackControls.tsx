import type { Dispatch, SetStateAction } from 'react';

export type PlaybackSpeed = 'slow' | 'normal' | 'fast' | 'ultra';

type PlaybackControlsProps = {
  moveCount: number;
  stepIndex: number;
  setStepIndex: Dispatch<SetStateAction<number>>;
  hasResult: boolean;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onPlay: () => void;
  onPause: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
};

export function PlaybackControls({
  moveCount,
  stepIndex,
  setStepIndex,
  hasResult,
  isPlaying,
  playbackSpeed,
  onPlay,
  onPause,
  onSpeedChange,
}: PlaybackControlsProps) {
  const canReset = hasResult && stepIndex > 0;
  const canPrev = hasResult && stepIndex > 0;
  const canNext = hasResult && stepIndex < moveCount;
  const canPlay = hasResult && moveCount > 0 && stepIndex < moveCount;
  const speeds: PlaybackSpeed[] = ['slow', 'normal', 'fast', 'ultra'];

  return (
    <div className="mt-4 space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          disabled={!canPlay && !isPlaying}
          className="rounded border border-slate-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={() => setStepIndex(0)}
          disabled={!canReset}
          className="rounded border border-slate-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => setStepIndex((current) => Math.min(moveCount, Math.max(0, current - 1)))}
          disabled={!canPrev}
          className="rounded border border-slate-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => setStepIndex((current) => Math.min(moveCount, Math.max(0, current + 1)))}
          disabled={!canNext}
          className="rounded border border-slate-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {speeds.map((speed) => (
          <button
            key={speed}
            type="button"
            onClick={() => onSpeedChange(speed)}
            className={`rounded border px-2 py-1 text-xs font-medium ${
              playbackSpeed === speed
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {speed}
          </button>
        ))}
      </div>
    </div>
  );
}
