import type { RobotColor } from '../features/puzzle/types';

type RobotTokenProps = {
  robot: RobotColor;
  isActive?: boolean;
};

const ROBOT_STYLES: Record<RobotColor, string> = {
  red: 'bg-red-500 text-white border-red-700',
  blue: 'bg-blue-500 text-white border-blue-700',
  yellow: 'bg-yellow-300 text-slate-950 border-yellow-500',
  green: 'bg-emerald-500 text-white border-emerald-700',
};

const ROBOT_LABELS: Record<RobotColor, string> = {
  red: 'R',
  blue: 'B',
  yellow: 'Y',
  green: 'G',
};

export function RobotToken({ robot, isActive = false }: RobotTokenProps) {
  return (
    <div
      className={`relative z-10 flex h-[72%] w-[72%] items-center justify-center rounded-full border-2 text-xs font-bold shadow-sm ${
        isActive ? 'ring-2 ring-slate-950 ring-offset-1' : ''
      } ${ROBOT_STYLES[robot]}`}
      aria-label={`${robot} robot`}
    >
      {ROBOT_LABELS[robot]}
    </div>
  );
}
