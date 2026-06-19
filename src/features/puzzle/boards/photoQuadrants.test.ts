import { describe, expect, it } from 'vitest';
import { getCellWalls, toIndex } from '../board';
import {
  composedPhotoBoardToBoard,
  composePhotoBoard,
  findRotationForSlot,
  getBlockedCellWalls,
  materializeQuadrant,
  ORIGINAL_PHOTO_BOARD,
  PHOTO_BOARD_QUADRANTS,
  rotateCellClockwise,
  rotateCornerClockwise,
  rotateWallClockwise,
  SHUFFLED_PHOTO_BOARD_1,
} from './photoQuadrants';

describe('photo quadrant board composition', () => {
  it('rotates cells, walls, and target corners clockwise', () => {
    expect(rotateCellClockwise({ x: 0, y: 7 })).toEqual({ x: 0, y: 0 });
    expect(rotateWallClockwise({ x: 2, y: 3, orientation: 'vertical' })).toEqual({
      x: 4,
      y: 2,
      orientation: 'horizontal',
    });
    expect(rotateWallClockwise({ x: 2, y: 3, orientation: 'horizontal' })).toEqual({
      x: 5,
      y: 2,
      orientation: 'vertical',
    });
    expect(rotateCornerClockwise('nw')).toBe('ne');
    expect(rotateCornerClockwise('se')).toBe('sw');
  });

  it('keeps the original quadrant order with zero rotations', () => {
    expect(ORIGINAL_PHOTO_BOARD.meta.rotations).toEqual({
      topLeft: 0,
      topRight: 0,
      bottomLeft: 0,
      bottomRight: 0,
    });
  });

  it('automatically rotates shuffled quadrants so cut cells face the center', () => {
    expect(SHUFFLED_PHOTO_BOARD_1.blockedCells).toEqual(
      expect.arrayContaining([
        { x: 7, y: 7 },
        { x: 8, y: 7 },
        { x: 7, y: 8 },
        { x: 8, y: 8 },
      ])
    );
    expect(SHUFFLED_PHOTO_BOARD_1.meta.rotations).toEqual({
      topLeft: 2,
      topRight: 2,
      bottomLeft: 2,
      bottomRight: 2,
    });
  });

  it('finds the rotation required by each slot', () => {
    const topLeft = materializeQuadrant(PHOTO_BOARD_QUADRANTS.topLeft);

    expect(findRotationForSlot(topLeft, 'topLeft')).toBe(0);
    expect(findRotationForSlot(topLeft, 'topRight')).toBe(1);
    expect(findRotationForSlot(topLeft, 'bottomRight')).toBe(2);
    expect(findRotationForSlot(topLeft, 'bottomLeft')).toBe(3);
  });

  it('blocks the center cutout with walls by default', () => {
    const board = composedPhotoBoardToBoard(ORIGINAL_PHOTO_BOARD);

    for (const [row, col] of [
      [7, 7],
      [7, 8],
      [8, 7],
      [8, 8],
    ]) {
      expect(getCellWalls(board, toIndex(row, col, board))).toEqual({
        top: true,
        right: true,
        bottom: true,
        left: true,
      });
    }
  });

  it('can compose without center block walls while preserving blocked cell metadata', () => {
    const composed = composePhotoBoard(
      {
        topLeft: 'topLeft',
        topRight: 'topRight',
        bottomLeft: 'bottomLeft',
        bottomRight: 'bottomRight',
      },
      { includeCenterBlockWalls: false }
    );

    expect(composed.blockedCells).toEqual(
      expect.arrayContaining([
        { x: 7, y: 7 },
        { x: 8, y: 7 },
        { x: 7, y: 8 },
        { x: 8, y: 8 },
      ])
    );
    expect(getBlockedCellWalls(composed.blockedCells, 16).length).toBeGreaterThan(0);
    expect(composed.walls).not.toEqual(
      expect.arrayContaining([{ x: 7, y: 7, orientation: 'horizontal' }])
    );
  });

  it('converts composed walls to the app Board type', () => {
    const board = composedPhotoBoardToBoard(ORIGINAL_PHOTO_BOARD);

    expect(board.width).toBe(16);
    expect(board.height).toBe(16);
    expect(board.walls).toHaveLength(256);
  });
});
