import { addWall, createEmptyBoard, toIndex } from './board';
import type { Board, PuzzleState } from './types';

const BOARD_SIZE = 16;

function createSampleBoard(): Board {
  let board = createEmptyBoard(BOARD_SIZE, BOARD_SIZE);

  board = addWall(board, toIndex(0, 5, board), 'up');
  board = addWall(board, toIndex(0, 5, board), 'right');
  board = addWall(board, toIndex(7, 7, board), 'right');
  board = addWall(board, toIndex(7, 7, board), 'down');
  board = addWall(board, toIndex(10, 3, board), 'right');
  board = addWall(board, toIndex(10, 4, board), 'down');

  return board;
}

export const sampleBoard: Board = createSampleBoard();

export const samplePuzzle: PuzzleState = {
  robots: {
    red: toIndex(0, 0, sampleBoard),
    blue: toIndex(0, 6, sampleBoard),
    yellow: toIndex(5, 5, sampleBoard),
    green: toIndex(12, 12, sampleBoard),
  },
  targetRobot: 'red',
  targetCell: toIndex(0, 5, sampleBoard),
};
