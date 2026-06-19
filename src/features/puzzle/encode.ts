import type { RobotColor, RobotState } from './types';

export const ROBOT_ORDER = ['red', 'blue', 'yellow', 'green'] as const;

export function encodeState(robots: RobotState): string {
  return ROBOT_ORDER.map((robot: RobotColor) => robots[robot]).join(',');
}
