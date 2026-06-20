import type { TargetRobotColor } from '../features/puzzle/types';

type TargetMarkerProps = {
  robot: TargetRobotColor;
};

const TARGET_STYLES: Record<TargetRobotColor, string> = {
  red: 'border-red-500 bg-red-100',
  blue: 'border-blue-500 bg-blue-100',
  yellow: 'border-yellow-500 bg-yellow-100',
  green: 'border-emerald-500 bg-emerald-100',
};

export function TargetMarker({ robot }: TargetMarkerProps) {
  return (
    <div
      className={`absolute inset-[15%] z-0 rounded-full border-2 border-dashed ${TARGET_STYLES[robot]}`}
      aria-label={`${robot} target`}
    />
  );
}
