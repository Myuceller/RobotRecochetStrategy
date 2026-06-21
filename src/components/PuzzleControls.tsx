type PuzzleControlsProps = {
  isGeneratingPuzzle: boolean;
  onGenerateRandom: () => void;
};

export function PuzzleControls({
  isGeneratingPuzzle,
  onGenerateRandom,
}: PuzzleControlsProps) {
  return (
    <button
      type="button"
      onClick={onGenerateRandom}
      disabled={isGeneratingPuzzle}
      className="rounded bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {isGeneratingPuzzle ? 'Starting...' : 'Start New Puzzle'}
    </button>
  );
}
