import { describe, expect, it } from 'vitest';
import { addCenterBlock, createEmptyBoard, toIndex } from './board';
import { sampleBoard, samplePuzzle } from './sampleBoard';
import {
  exportPuzzleToJson,
  parsePuzzleFromJson,
  validateExportedPuzzle,
  type ExportedPuzzle,
} from './share';

function makeValidExport(): ExportedPuzzle {
  return {
    version: 1,
    app: 'sliding-robot-lab',
    board: sampleBoard,
    puzzle: samplePuzzle,
  };
}

describe('puzzle share format', () => {
  it('exports version, app, board, and puzzle', () => {
    const json = exportPuzzleToJson(sampleBoard, samplePuzzle, { source: 'sample' });
    const parsed = JSON.parse(json) as ExportedPuzzle;

    expect(parsed.version).toBe(1);
    expect(parsed.app).toBe('sliding-robot-lab');
    expect(parsed.board).toEqual(sampleBoard);
    expect(parsed.puzzle).toEqual(samplePuzzle);
    expect(parsed.meta?.source).toBe('sample');
    expect(typeof parsed.meta?.createdAt).toBe('string');
  });

  it('parses valid JSON', () => {
    const exported = makeValidExport();

    expect(parsePuzzleFromJson(JSON.stringify(exported))).toEqual(exported);
  });

  it('throws for invalid JSON', () => {
    expect(() => parsePuzzleFromJson('{bad json')).toThrow('not valid JSON');
  });

  it('throws when version is not supported', () => {
    expect(() => validateExportedPuzzle({ ...makeValidExport(), version: 2 })).toThrow('version');
  });

  it('throws when app is different', () => {
    expect(() => validateExportedPuzzle({ ...makeValidExport(), app: 'other-app' })).toThrow('app');
  });

  it('throws when board wall length is invalid', () => {
    const exported = makeValidExport();

    expect(() =>
      validateExportedPuzzle({
        ...exported,
        board: {
          ...exported.board,
          walls: exported.board.walls.slice(1),
        },
      })
    ).toThrow('board.walls length');
  });

  it('throws when a robot is missing', () => {
    const exported = makeValidExport();
    const robots: Partial<typeof exported.puzzle.robots> = { ...exported.puzzle.robots };
    delete robots.green;

    expect(() =>
      validateExportedPuzzle({
        ...exported,
        puzzle: {
          ...exported.puzzle,
          robots,
        },
      })
    ).toThrow('puzzle.robots.green');
  });

  it('throws when robot positions overlap', () => {
    const exported = makeValidExport();

    expect(() =>
      validateExportedPuzzle({
        ...exported,
        puzzle: {
          ...exported.puzzle,
          robots: {
            ...exported.puzzle.robots,
            blue: exported.puzzle.robots.red,
          },
        },
      })
    ).toThrow('distinct');
  });

  it('throws when target overlaps a robot', () => {
    const exported = makeValidExport();

    expect(() =>
      validateExportedPuzzle({
        ...exported,
        puzzle: {
          ...exported.puzzle,
          targetCell: exported.puzzle.robots.red,
        },
      })
    ).toThrow('targetCell');
  });

  it('throws when target is not inside a corner wall target cell', () => {
    const exported = makeValidExport();

    expect(() =>
      validateExportedPuzzle({
        ...exported,
        puzzle: {
          ...exported.puzzle,
          targetCell: 1,
        },
      })
    ).toThrow('corner wall');
  });

  it('throws when a robot is in the 16x16 center block', () => {
    const board = addCenterBlock(sampleBoard);
    const cell = toIndex(7, 7, board);

    expect(() =>
      validateExportedPuzzle({
        version: 1,
        app: 'sliding-robot-lab',
        board,
        puzzle: {
          ...samplePuzzle,
          robots: {
            ...samplePuzzle.robots,
            red: cell,
          },
        },
      })
    ).toThrow('center block');
  });

  it('throws when target is in the 16x16 center block', () => {
    const board = addCenterBlock(createEmptyBoard(16, 16));

    expect(() =>
      validateExportedPuzzle({
        version: 1,
        app: 'sliding-robot-lab',
        board,
        puzzle: {
          ...samplePuzzle,
          targetCell: toIndex(8, 8, board),
        },
      })
    ).toThrow('center block');
  });

  it('validates the normal sample puzzle', () => {
    expect(validateExportedPuzzle(makeValidExport())).toEqual(makeValidExport());
  });
});
