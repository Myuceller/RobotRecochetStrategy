import type { ReactNode } from 'react';
import type { CellWalls } from '../features/puzzle/types';

type BoardCellProps = {
  walls: CellWalls;
  heat?: number;
  maxHeat?: number;
  isSampled?: boolean;
  isBlocked?: boolean;
  isEditing?: boolean;
  editable?: boolean;
  pathRole?: 'from' | 'to' | 'path' | null;
  onClick?: () => void;
  children?: ReactNode;
};

export function BoardCell({
  walls,
  heat = 0,
  maxHeat = 0,
  isSampled = false,
  isBlocked = false,
  isEditing = false,
  editable = false,
  pathRole = null,
  onClick,
  children,
}: BoardCellProps) {
  const gridColor = '#cbd5e1';
  const wallColor = '#0f172a';
  const heatRatio = maxHeat > 0 ? heat / maxHeat : 0;
  const heatAlpha = Math.min(0.42, heatRatio * 0.34);
  const backgroundColor = isBlocked
    ? '#334155'
    : pathRole === 'from'
    ? 'rgba(34, 197, 94, 0.58)'
    : pathRole === 'to'
      ? 'rgba(59, 130, 246, 0.58)'
      : pathRole === 'path'
        ? 'rgba(14, 165, 233, 0.36)'
        : isSampled
    ? 'rgba(251, 146, 60, 0.55)'
    : heat > 0
      ? `rgba(251, 191, 36, ${Math.max(0.1, heatAlpha)})`
      : '#f8fafc';

  return (
    <div
      className={`relative flex aspect-square items-center justify-center ${
        editable && !isBlocked ? 'cursor-pointer hover:outline hover:outline-2 hover:outline-slate-500' : ''
      } ${isEditing && !editable ? 'cursor-not-allowed' : ''}`}
      onClick={onClick}
      style={{
        backgroundColor,
        borderTop: `${walls.top ? 3 : 1}px solid ${walls.top ? wallColor : gridColor}`,
        borderRight: `${walls.right ? 3 : 1}px solid ${walls.right ? wallColor : gridColor}`,
        borderBottom: `${walls.bottom ? 3 : 1}px solid ${walls.bottom ? wallColor : gridColor}`,
        borderLeft: `${walls.left ? 3 : 1}px solid ${walls.left ? wallColor : gridColor}`,
      }}
    >
      {children}
    </div>
  );
}
