import { describe, expect, it } from 'vitest';
import { addWall, createEmptyBoard, toIndex } from './board';
import { applyMove, generateMoves, slideRobot } from './movement';
import type { RobotState } from './types';

function createRobots(board = createEmptyBoard(4, 4)): RobotState {
  return {
    red: toIndex(1, 1, board),
    blue: toIndex(3, 3, board),
    yellow: toIndex(0, 3, board),
    green: toIndex(3, 0, board),
    black: toIndex(2, 2, board),
  };
}

describe('movement', () => {
  it('slides a robot to the board edge', () => {
    const board = createEmptyBoard(4, 4);
    const robots = createRobots(board);

    expect(slideRobot(board, robots, 'red', 'right')).toEqual({
      robot: 'red',
      direction: 'right',
      from: toIndex(1, 1, board),
      to: toIndex(1, 3, board),
    });
  });

  it('stops before a wall', () => {
    const emptyBoard = createEmptyBoard(4, 4);
    const board = addWall(emptyBoard, toIndex(1, 2, emptyBoard), 'right');
    const robots = createRobots(board);

    expect(slideRobot(board, robots, 'red', 'right')?.to).toBe(toIndex(1, 2, board));
  });

  it('stops before another robot in the next cell', () => {
    const board = createEmptyBoard(4, 4);
    const robots: RobotState = {
      red: toIndex(1, 1, board),
      blue: toIndex(1, 3, board),
      yellow: toIndex(0, 3, board),
      green: toIndex(3, 0, board),
      black: toIndex(2, 2, board),
    };

    expect(slideRobot(board, robots, 'red', 'right')?.to).toBe(toIndex(1, 2, board));
  });

  it('returns null when the robot cannot move at all', () => {
    const emptyBoard = createEmptyBoard(4, 4);
    const board = addWall(emptyBoard, toIndex(0, 0, emptyBoard), 'up');
    const robots: RobotState = {
      red: toIndex(0, 0, board),
      blue: toIndex(3, 3, board),
      yellow: toIndex(0, 3, board),
      green: toIndex(3, 0, board),
      black: toIndex(2, 2, board),
    };

    expect(slideRobot(board, robots, 'red', 'up')).toBeNull();
  });

  it('applies a move without mutating the original robot state', () => {
    const board = createEmptyBoard(4, 4);
    const robots = createRobots(board);
    const move = {
      robot: 'red' as const,
      direction: 'right' as const,
      from: toIndex(1, 1, board),
      to: toIndex(1, 3, board),
    };

    const nextRobots = applyMove(robots, move);

    expect(nextRobots.red).toBe(toIndex(1, 3, board));
    expect(robots.red).toBe(toIndex(1, 1, board));
    expect(nextRobots).not.toBe(robots);
  });

  it('generates only moves that change a robot position', () => {
    const board = createEmptyBoard(4, 4);
    const robots = createRobots(board);
    const moves = generateMoves(board, robots);

    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((move) => move.from !== move.to)).toBe(true);
  });
});
