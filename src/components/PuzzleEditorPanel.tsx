import type { Dispatch, SetStateAction } from 'react';
import type { Direction, RobotColor } from '../features/puzzle/types';

export type EditorMode = 'off' | 'placeRobot' | 'placeTarget' | 'toggleWall';

const ROBOT_COLORS: RobotColor[] = ['red', 'blue', 'yellow', 'green'];
const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left'];

type PuzzleEditorPanelProps = {
  editorMode: EditorMode;
  selectedEditorRobot: RobotColor;
  selectedWallDirection: Direction;
  targetRobot: RobotColor;
  disabled?: boolean;
  onEditorModeChange: Dispatch<SetStateAction<EditorMode>>;
  onSelectedEditorRobotChange: (robot: RobotColor) => void;
  onSelectedWallDirectionChange: (direction: Direction) => void;
  onTargetRobotChange: (robot: RobotColor) => void;
};

export function PuzzleEditorPanel({
  editorMode,
  selectedEditorRobot,
  selectedWallDirection,
  targetRobot,
  disabled = false,
  onEditorModeChange,
  onSelectedEditorRobotChange,
  onSelectedWallDirectionChange,
  onTargetRobotChange,
}: PuzzleEditorPanelProps) {
  const isEditing = editorMode !== 'off';
  const inactiveButton = 'border-slate-300 text-slate-700 hover:bg-slate-50';
  const activeButton = 'border-slate-900 bg-slate-900 text-white';
  const disabledButton = disabled ? 'cursor-not-allowed opacity-50 hover:bg-transparent' : '';

  return (
    <details className="mb-3 rounded border border-slate-300 bg-white text-sm shadow-sm">
      <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-slate-800">
        Custom Puzzle Editor
        <span className="ml-2 text-xs font-normal text-slate-500">
          {isEditing ? `active: ${editorMode}` : 'collapsed'}
        </span>
      </summary>
      <section className="border-t border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Editor Tools</h2>
          <p className="mt-1 text-slate-600">
            {isEditing ? 'Click a board cell to edit the active puzzle.' : 'Editor is off.'}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onEditorModeChange(isEditing ? 'off' : 'placeRobot')}
          className={`rounded px-4 py-2 text-sm font-semibold ${
            isEditing
              ? 'border border-slate-300 text-slate-700 hover:bg-slate-50'
              : 'bg-slate-900 text-white hover:bg-slate-700'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {isEditing ? 'Turn Off' : 'Edit Puzzle'}
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
            Mode
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onEditorModeChange('placeRobot')}
              className={`rounded border px-3 py-2 text-sm font-medium ${
                editorMode === 'placeRobot' ? activeButton : inactiveButton
              } ${disabledButton}`}
            >
              Place Robot
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onEditorModeChange('placeTarget')}
              className={`rounded border px-3 py-2 text-sm font-medium ${
                editorMode === 'placeTarget' ? activeButton : inactiveButton
              } ${disabledButton}`}
            >
              Place Target
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onEditorModeChange('toggleWall')}
              className={`rounded border px-3 py-2 text-sm font-medium ${
                editorMode === 'toggleWall' ? activeButton : inactiveButton
              } ${disabledButton}`}
            >
              Toggle Wall
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
            Robot
          </div>
          <div className="grid grid-cols-4 gap-2">
            {ROBOT_COLORS.map((robot) => (
              <button
                key={robot}
                type="button"
                disabled={disabled}
                onClick={() => onSelectedEditorRobotChange(robot)}
                className={`rounded border px-2 py-2 text-xs font-semibold capitalize ${
                  selectedEditorRobot === robot ? activeButton : inactiveButton
                } ${disabledButton}`}
              >
                {robot}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
            Wall Direction
          </div>
          <div className="grid grid-cols-4 gap-2">
            {DIRECTIONS.map((direction) => (
              <button
                key={direction}
                type="button"
                disabled={disabled}
                onClick={() => onSelectedWallDirectionChange(direction)}
                className={`rounded border px-2 py-2 text-xs font-semibold capitalize ${
                  selectedWallDirection === direction ? activeButton : inactiveButton
                } ${disabledButton}`}
              >
                {direction}
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="target-robot"
          className="mb-2 block text-xs font-semibold uppercase tracking-normal text-slate-500"
        >
          Target Robot
        </label>
        <select
          id="target-robot"
          value={targetRobot}
          disabled={disabled}
          onChange={(event) => onTargetRobotChange(event.target.value as RobotColor)}
          className={`w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm capitalize text-slate-900 ${
            disabled ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          {ROBOT_COLORS.map((robot) => (
            <option key={robot} value={robot}>
              {robot}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Place Robot/Target changes the active puzzle. Toggle Wall adds or removes the selected
        cell edge. Center blocked cells, occupied robot cells, and outer board boundaries are
        protected.
      </p>
      </section>
    </details>
  );
}
