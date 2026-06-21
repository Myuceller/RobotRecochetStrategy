import type { TargetRobotColor } from '../features/puzzle/types';

type TargetMarkerProps = {
  robot: TargetRobotColor;
  targetId?: number;
  isActive?: boolean;
};

const TARGET_STYLES: Record<TargetRobotColor, string> = {
  red: 'border-red-500 bg-red-100',
  blue: 'border-blue-500 bg-blue-100',
  yellow: 'border-yellow-500 bg-yellow-100',
  green: 'border-emerald-500 bg-emerald-100',
};

export function TargetMarker({ robot, targetId, isActive = true }: TargetMarkerProps) {
  return (
    <div
      className={`absolute flex items-center justify-center rounded-full border-2 border-dashed text-[9px] font-bold leading-none ${
        isActive ? 'inset-[13%] z-[2] shadow-sm' : 'inset-[23%] z-[1] opacity-60'
      } ${TARGET_STYLES[robot]}`}
      aria-label={targetId === undefined ? `${robot} target` : `${robot} target ${targetId}`}
    >
      {targetId}
    </div>
  );
}
