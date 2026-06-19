export type PuzzleDifficultyId = 'easy' | 'normal' | 'hard';

export type PuzzleDifficultyPreset = {
  id: PuzzleDifficultyId;
  label: string;
  description: string;
  minDepth: number;
  maxDepth: number;
  maxAttempts: number;
  solveMaxVisited: number;
  solveMaxDepth: number;
};

export const PUZZLE_DIFFICULTY_PRESETS: PuzzleDifficultyPreset[] = [
  {
    id: 'easy',
    label: 'Easy',
    description: '빠르게 풀리는 짧은 퍼즐',
    minDepth: 2,
    maxDepth: 5,
    maxAttempts: 30,
    solveMaxVisited: 50_000,
    solveMaxDepth: 20,
  },
  {
    id: 'normal',
    label: 'Normal',
    description: '기본 난이도 퍼즐',
    minDepth: 6,
    maxDepth: 10,
    maxAttempts: 50,
    solveMaxVisited: 100_000,
    solveMaxDepth: 30,
  },
  {
    id: 'hard',
    label: 'Hard',
    description: '생성 실패 가능성이 있는 긴 퍼즐',
    minDepth: 11,
    maxDepth: 15,
    maxAttempts: 80,
    solveMaxVisited: 200_000,
    solveMaxDepth: 40,
  },
];

export function getPuzzleDifficultyPreset(
  id: PuzzleDifficultyId
): PuzzleDifficultyPreset {
  const preset = PUZZLE_DIFFICULTY_PRESETS.find((difficulty) => difficulty.id === id);

  if (!preset) {
    throw new Error(`Unknown puzzle difficulty: ${id}`);
  }

  return preset;
}
