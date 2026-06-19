import type { PuzzleDifficultyId, PuzzleDifficultyPreset } from '../features/puzzle/puzzleDifficulty';
import type {
  SamplePuzzleDefinition,
  SamplePuzzleId,
} from '../features/puzzle/samplePuzzles';

type PuzzleControlsProps = {
  puzzleSource: 'sample' | 'random' | 'custom';
  samplePuzzles: SamplePuzzleDefinition[];
  selectedSamplePuzzleId: SamplePuzzleId;
  difficultyPresets: PuzzleDifficultyPreset[];
  selectedDifficulty: PuzzleDifficultyId;
  generationInfo: {
    attempts?: number;
    solutionDepth?: number;
    difficultyLabel?: string;
    generatedBy?: string;
    source?: string;
    targetId?: number;
    hasVerifiedSolution?: boolean;
  } | null;
  generationError: string | null;
  isGeneratingPuzzle: boolean;
  isSolving: boolean;
  onSelectSamplePuzzle: (sampleId: SamplePuzzleId) => void;
  onSelectDifficulty: (difficulty: PuzzleDifficultyId) => void;
  onGenerateRandom: () => void;
  onCancelGeneration: () => void;
  onResetSample: () => void;
};

export function PuzzleControls({
  puzzleSource,
  samplePuzzles,
  selectedSamplePuzzleId,
  difficultyPresets,
  selectedDifficulty,
  generationInfo,
  generationError,
  isGeneratingPuzzle,
  isSolving,
  onSelectSamplePuzzle,
  onSelectDifficulty,
  onGenerateRandom,
  onCancelGeneration,
  onResetSample,
}: PuzzleControlsProps) {
  const selectedPreset = difficultyPresets.find((preset) => preset.id === selectedDifficulty);
  const selectedSample = samplePuzzles.find((sample) => sample.id === selectedSamplePuzzleId);
  const isPuzzleSwitchDisabled = isGeneratingPuzzle || isSolving;
  const sourceLabel =
    puzzleSource === 'sample' ? 'Sample' : puzzleSource === 'random' ? 'Random' : 'Custom';

  return (
    <section className="p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Puzzle</h2>
          <p className="mt-1 text-slate-600">
            Current: <span className="font-semibold text-slate-900">{sourceLabel}</span>
            {generationInfo?.solutionDepth ? (
              <span className="ml-2 text-xs">verified {generationInfo.solutionDepth} moves</span>
            ) : null}
          </p>
          {puzzleSource === 'custom' ? (
            <p className="mt-1 text-xs text-slate-500">Edited puzzle on current board</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onGenerateRandom}
            disabled={isGeneratingPuzzle}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isGeneratingPuzzle
              ? 'Generating...'
              : `Generate ${selectedPreset?.label ?? 'Random'} Puzzle`}
          </button>
          {isGeneratingPuzzle ? (
            <button
              type="button"
              onClick={onCancelGeneration}
              className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel Generation
            </button>
          ) : null}
          <button
            type="button"
            onClick={onResetSample}
            disabled={isGeneratingPuzzle || (puzzleSource === 'sample' && !isSolving)}
            className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset to Sample Puzzle
          </button>
        </div>
      </div>

      <details className="mt-4 rounded border border-slate-200 bg-white">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
          Sample and difficulty
        </summary>
        <div className="border-t border-slate-200 p-3">
          <label
            htmlFor="sample-puzzle"
            className="mb-2 block text-xs font-semibold uppercase tracking-normal text-slate-500"
          >
            Sample Puzzle
          </label>
          <select
            id="sample-puzzle"
            value={selectedSamplePuzzleId}
            onChange={(event) => onSelectSamplePuzzle(event.target.value)}
            disabled={isPuzzleSwitchDisabled}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {samplePuzzles.map((sample) => (
              <option key={sample.id} value={sample.id}>
                {sample.title}
              </option>
            ))}
          </select>
          {selectedSample ? (
            <p className="mt-2 text-xs text-slate-500">{selectedSample.description}</p>
          ) : null}

          <div className="mt-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
              Difficulty
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {difficultyPresets.map((preset) => {
                const isSelected = preset.id === selectedDifficulty;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectDifficulty(preset.id)}
                    disabled={isGeneratingPuzzle}
                    className={`rounded border p-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold">{preset.label}</div>
                    <div className={isSelected ? 'text-slate-200' : 'text-slate-500'}>
                      {preset.minDepth}-{preset.maxDepth} moves
                    </div>
                    <div
                      className={`mt-1 text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}
                    >
                      {preset.description}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedDifficulty === 'hard' ? (
              <p className="mt-2 text-xs text-slate-500">
                Hard는 생성에 시간이 더 걸리거나 실패할 수 있습니다.
              </p>
            ) : null}
          </div>
        </div>
      </details>

      {isGeneratingPuzzle ? (
        <p className="mt-3 text-slate-600">랜덤 퍼즐 생성 중...</p>
      ) : null}

      {puzzleSource === 'random' && generationInfo ? (
        <div className="mt-3 rounded bg-slate-50 p-3 text-xs text-slate-600">
          Generated by {generationInfo.generatedBy ?? '-'} / attempts {generationInfo.attempts ?? '-'}
          / target {generationInfo.targetId ?? '-'} /{' '}
          {generationInfo.hasVerifiedSolution ? '해답 있음' : '해답 미확인'}
        </div>
      ) : null}

      {generationError ? (
        <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-red-700">
          <div>{generationError}</div>
          <div className="mt-1 text-xs text-red-600">
            조건에 맞는 퍼즐을 찾지 못했다면 Easy로 낮춰보세요.
          </div>
        </div>
      ) : null}
    </section>
  );
}
