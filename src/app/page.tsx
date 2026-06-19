'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BoardView } from '../components/BoardView';
import { PuzzleControls } from '../components/PuzzleControls';
import { PuzzleEditorPanel, type EditorMode } from '../components/PuzzleEditorPanel';
import { PuzzleSharePanel } from '../components/PuzzleSharePanel';
import { SearchProgressPanel } from '../components/SearchProgressPanel';
import { SolutionPanel } from '../components/SolutionPanel';
import {
  canToggleWall,
  moveRobotInPuzzle,
  setTargetCellInPuzzle,
  setTargetRobotInPuzzle,
  toggleWallInBoard,
} from '../features/puzzle/editor';
import { applyMove } from '../features/puzzle/movement';
import { getMovePath } from '../features/puzzle/playback';
import {
  getPuzzleDifficultyPreset,
  PUZZLE_DIFFICULTY_PRESETS,
  type PuzzleDifficultyId,
} from '../features/puzzle/puzzleDifficulty';
import {
  getSamplePuzzleById,
  samplePuzzles,
  type SamplePuzzleId,
} from '../features/puzzle/samplePuzzles';
import { exportPuzzleToJson, parsePuzzleFromJson } from '../features/puzzle/share';
import { parseWallSpecImportFromJson } from '../features/puzzle/wallSpec';
import type {
  Board,
  CellIndex,
  Direction,
  PuzzleState,
  RobotColor,
  RobotState,
  SearchProgress,
  SolveResult,
} from '../features/puzzle/types';
import type { PlaybackSpeed } from '../components/PlaybackControls';
import type {
  PuzzleGeneratorWorkerRequest,
  PuzzleGeneratorWorkerResponse,
} from '../features/puzzle/puzzleGeneratorWorkerTypes';
import type { SolverWorkerRequest, SolverWorkerResponse } from '../features/puzzle/workerTypes';

function getRobotsAtStep(
  initialRobots: RobotState,
  result: SolveResult | null,
  stepIndex: number
): RobotState {
  const moves = result?.moves ?? [];
  const clampedStep = Math.min(Math.max(stepIndex, 0), moves.length);

  return moves.slice(0, clampedStep).reduce<RobotState>(
    (robots, move) => applyMove(robots, move),
    initialRobots
  );
}

const PLAYBACK_INTERVAL_MS: Record<PlaybackSpeed, number> = {
  slow: 600,
  normal: 300,
  fast: 120,
  ultra: 60,
};

export default function Page() {
  const initialSample = samplePuzzles[0];
  const [activeBoard, setActiveBoard] = useState<Board>(initialSample.board);
  const [activePuzzle, setActivePuzzle] = useState<PuzzleState>(initialSample.puzzle);
  const [puzzleSource, setPuzzleSource] = useState<'sample' | 'random' | 'custom'>('sample');
  const [selectedSamplePuzzleId, setSelectedSamplePuzzleId] = useState<SamplePuzzleId>(
    initialSample.id
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<PuzzleDifficultyId>('normal');
  const [generationInfo, setGenerationInfo] = useState<{
    attempts?: number;
    solutionDepth?: number;
    difficultyLabel?: string;
    generatedBy?: string;
    source?: string;
    targetId?: number;
    hasVerifiedSolution?: boolean;
  } | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGeneratingPuzzle, setIsGeneratingPuzzle] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlayingSolution, setIsPlayingSolution] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>('normal');
  const [editorMode, setEditorMode] = useState<EditorMode>('off');
  const [selectedEditorRobot, setSelectedEditorRobot] = useState<RobotColor>('red');
  const [selectedWallDirection, setSelectedWallDirection] = useState<Direction>('right');
  const [isSolving, setIsSolving] = useState(false);
  const [progress, setProgress] = useState<SearchProgress | null>(null);
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [exportedJson, setExportedJson] = useState('');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const generationWorkerRef = useRef<Worker | null>(null);
  const activeGenerationRequestIdRef = useRef<string | null>(null);

  const currentRobots = useMemo(
    () => getRobotsAtStep(activePuzzle.robots, result, stepIndex),
    [activePuzzle.robots, result, stepIndex]
  );
  const currentMove =
    result?.found && stepIndex > 0 ? result.moves[stepIndex - 1] : null;
  const currentMovePath = useMemo(
    () => (currentMove ? getMovePath(activeBoard, currentMove) : null),
    [activeBoard, currentMove]
  );

  useEffect(() => {
    if (!isPlayingSolution || !result?.found) {
      return;
    }

    if (stepIndex >= result.moves.length) {
      setIsPlayingSolution(false);
      return;
    }

    const intervalId = setInterval(() => {
      setStepIndex((current) => {
        const next = Math.min(result.moves.length, current + 1);

        if (next >= result.moves.length) {
          setIsPlayingSolution(false);
        }

        return next;
      });
    }, PLAYBACK_INTERVAL_MS[playbackSpeed]);

    return () => {
      clearInterval(intervalId);
    };
  }, [isPlayingSolution, playbackSpeed, result, stepIndex]);

  useEffect(() => {
    if (isSolving || isGeneratingPuzzle || !result?.found) {
      setIsPlayingSolution(false);
    }
  }, [isGeneratingPuzzle, isSolving, result]);

  useEffect(() => {
    return () => {
      const activeId = activeRequestIdRef.current;

      if (activeId) {
        workerRef.current?.postMessage({
          type: 'cancel',
          id: activeId,
        } satisfies SolverWorkerRequest);
      }

      workerRef.current?.terminate();
      workerRef.current = null;
      activeRequestIdRef.current = null;

      const activeGenerationId = activeGenerationRequestIdRef.current;

      if (activeGenerationId) {
        generationWorkerRef.current?.postMessage({
          type: 'cancel',
          id: activeGenerationId,
        } satisfies PuzzleGeneratorWorkerRequest);
      }

      generationWorkerRef.current?.terminate();
      generationWorkerRef.current = null;
      activeGenerationRequestIdRef.current = null;
    };
  }, []);

  const finishActiveWorker = (worker: Worker, requestId: string) => {
    if (workerRef.current === worker) {
      worker.terminate();
      workerRef.current = null;
    }

    if (activeRequestIdRef.current === requestId) {
      activeRequestIdRef.current = null;
    }
  };

  const finishGenerationWorker = (worker: Worker, requestId: string) => {
    if (generationWorkerRef.current === worker) {
      worker.terminate();
      generationWorkerRef.current = null;
    }

    if (activeGenerationRequestIdRef.current === requestId) {
      activeGenerationRequestIdRef.current = null;
    }
  };

  const stopActiveWorker = () => {
    const activeId = activeRequestIdRef.current;

    if (activeId) {
      workerRef.current?.postMessage({
        type: 'cancel',
        id: activeId,
      } satisfies SolverWorkerRequest);
    }

    workerRef.current?.terminate();
    workerRef.current = null;
    activeRequestIdRef.current = null;
    setIsSolving(false);
  };

  const stopActiveGenerationWorker = () => {
    const activeId = activeGenerationRequestIdRef.current;

    if (activeId) {
      generationWorkerRef.current?.postMessage({
        type: 'cancel',
        id: activeId,
      } satisfies PuzzleGeneratorWorkerRequest);
    }

    generationWorkerRef.current?.terminate();
    generationWorkerRef.current = null;
    activeGenerationRequestIdRef.current = null;
    setIsGeneratingPuzzle(false);
  };

  const resetTransientState = () => {
    setIsPlayingSolution(false);
    setResult(null);
    setProgress(null);
    setWorkerError(null);
    setStepIndex(0);
  };

  const activateSamplePuzzle = (sampleId: SamplePuzzleId) => {
    const sample = getSamplePuzzleById(sampleId);

    if (!sample) {
      return;
    }

    setIsPlayingSolution(false);
    stopActiveWorker();
    stopActiveGenerationWorker();
    setSelectedSamplePuzzleId(sample.id);
    setActiveBoard(sample.board);
    setActivePuzzle(sample.puzzle);
    setPuzzleSource('sample');
    setGenerationInfo(null);
    setGenerationError(null);
    setImportError(null);
    setImportSuccess(null);
    resetTransientState();
  };

  const applyPuzzleEdit = (nextPuzzle: PuzzleState) => {
    if (nextPuzzle === activePuzzle) {
      return;
    }

    stopActiveWorker();
    stopActiveGenerationWorker();
    setActivePuzzle(nextPuzzle);
    setPuzzleSource('custom');
    setGenerationInfo(null);
    setGenerationError(null);
    setImportError(null);
    setImportSuccess(null);
    resetTransientState();
  };

  const applyBoardEdit = (nextBoard: Board) => {
    if (nextBoard === activeBoard) {
      return;
    }

    stopActiveWorker();
    stopActiveGenerationWorker();
    setActiveBoard(nextBoard);
    setPuzzleSource('custom');
    setGenerationInfo(null);
    setGenerationError(null);
    setImportError(null);
    setImportSuccess(null);
    resetTransientState();
  };

  const handleExportPuzzle = () => {
    setExportedJson(
      exportPuzzleToJson(activeBoard, activePuzzle, {
        source: puzzleSource,
      })
    );
    setImportError(null);
    setImportSuccess(null);
  };

  const handleImportPuzzle = () => {
    if (isSolving || isGeneratingPuzzle) {
      return;
    }

    try {
      let imported: { board: Board; puzzle: PuzzleState };
      let importKind = 'puzzle';

      try {
        imported = parsePuzzleFromJson(importText);
      } catch {
        imported = parseWallSpecImportFromJson(importText, activePuzzle);
        importKind = 'wall spec';
      }

      stopActiveWorker();
      stopActiveGenerationWorker();
      setActiveBoard(imported.board);
      setActivePuzzle(imported.puzzle);
      setPuzzleSource('custom');
      setGenerationInfo(null);
      setGenerationError(null);
      setImportError(null);
      setImportSuccess(`Imported ${importKind} as custom.`);
      resetTransientState();
    } catch (error) {
      setImportSuccess(null);
      setImportError(error instanceof Error ? error.message : 'Import failed.');
    }
  };

  const handleEditorCellClick = (cell: CellIndex) => {
    if (editorMode === 'off' || isSolving || isGeneratingPuzzle) {
      return;
    }

    if (editorMode === 'placeRobot') {
      applyPuzzleEdit(moveRobotInPuzzle(activeBoard, activePuzzle, selectedEditorRobot, cell));
      return;
    }

    if (editorMode === 'toggleWall') {
      applyBoardEdit(toggleWallInBoard(activeBoard, cell, selectedWallDirection));
      return;
    }

    applyPuzzleEdit(setTargetCellInPuzzle(activeBoard, activePuzzle, cell));
  };

  const handleTargetRobotChange = (robot: RobotColor) => {
    if (isSolving || isGeneratingPuzzle) {
      return;
    }

    applyPuzzleEdit(setTargetRobotInPuzzle(activePuzzle, robot));
  };

  const canEditCell = (cell: CellIndex) =>
    editorMode === 'toggleWall'
      ? canToggleWall(activeBoard, cell, selectedWallDirection)
      : true;

  const handleSolve = () => {
    setIsPlayingSolution(false);
    const previousRequestId = activeRequestIdRef.current;

    if (previousRequestId) {
      workerRef.current?.postMessage({
        type: 'cancel',
        id: previousRequestId,
      } satisfies SolverWorkerRequest);
    }

    workerRef.current?.terminate();

    const requestId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const worker = new Worker(new URL('../features/puzzle/solverWorker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current = worker;
    activeRequestIdRef.current = requestId;
    setResult(null);
    setProgress(null);
    setWorkerError(null);
    setIsSolving(true);
    setStepIndex(0);

    worker.onmessage = (event: MessageEvent<SolverWorkerResponse>) => {
      const message = event.data;

      if (message.id !== activeRequestIdRef.current) {
        return;
      }

      if (message.type === 'progress') {
        setProgress(message.progress);
        return;
      }

      if (message.type === 'result') {
        setResult(message.result);
        setProgress((currentProgress) =>
          currentProgress
            ? {
                ...currentProgress,
                status:
                  message.result.reason ??
                  (message.result.found ? 'solved' : 'notFound'),
                visitedCount: message.result.visitedCount,
                depth: message.result.depth,
                frontierSize: 0,
                message: message.result.found
                  ? `Solved at depth ${message.result.depth}.`
                  : `Search ended: ${message.result.reason ?? 'notFound'}.`,
              }
            : currentProgress
        );
        setIsSolving(false);
        setStepIndex(0);
        finishActiveWorker(worker, requestId);
        return;
      }

      setWorkerError(message.message);
      setIsSolving(false);
      setStepIndex(0);
      finishActiveWorker(worker, requestId);
    };

    worker.onerror = (event) => {
      if (requestId !== activeRequestIdRef.current) {
        return;
      }

      setWorkerError(event.message || 'Solver worker failed.');
      setIsSolving(false);
      setStepIndex(0);
      finishActiveWorker(worker, requestId);
    };

    worker.postMessage({
      type: 'start',
      id: requestId,
      board: activeBoard,
      puzzle: activePuzzle,
      options: {
        maxVisited: 250_000,
        maxDepth: 50,
        maxQueueSize: 250_000,
        chunkSize: 50,
        progressInterval: 50,
      },
    } satisfies SolverWorkerRequest);
  };

  const handleCancel = () => {
    const activeId = activeRequestIdRef.current;

    if (!activeId) {
      return;
    }

    workerRef.current?.postMessage({
      type: 'cancel',
      id: activeId,
    } satisfies SolverWorkerRequest);
  };

  const createRequestId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  const handleGenerateRandomPuzzle = () => {
    setIsPlayingSolution(false);
    stopActiveWorker();
    stopActiveGenerationWorker();
    resetTransientState();
    setGenerationError(null);
    setGenerationInfo(null);
    setIsGeneratingPuzzle(true);

    const preset = getPuzzleDifficultyPreset(selectedDifficulty);
    const requestId = createRequestId();
    const worker = new Worker(
      new URL('../features/puzzle/puzzleGeneratorWorker.ts', import.meta.url),
      {
        type: 'module',
      }
    );

    generationWorkerRef.current = worker;
    activeGenerationRequestIdRef.current = requestId;

    worker.onmessage = (event: MessageEvent<PuzzleGeneratorWorkerResponse>) => {
      const message = event.data;

      if (message.id !== activeGenerationRequestIdRef.current) {
        return;
      }

      if (message.type === 'result') {
        setActiveBoard(message.result.board);
        setActivePuzzle(message.result.puzzle);
        setPuzzleSource('random');
        setStepIndex(0);
        setGenerationInfo({
          attempts: message.result.attempts,
          solutionDepth: message.result.solution.depth,
          difficultyLabel: preset.label,
          generatedBy: message.result.meta.generatedBy,
          source: message.result.meta.source,
          targetId: message.result.meta.targetId,
          hasVerifiedSolution: message.result.solution.found,
        });
        setImportError(null);
        setImportSuccess(null);
        setIsGeneratingPuzzle(false);
        finishGenerationWorker(worker, requestId);
        return;
      }

      if (message.type === 'cancelled') {
        setIsGeneratingPuzzle(false);
        finishGenerationWorker(worker, requestId);
        return;
      }

      setGenerationError(message.message);
      setIsGeneratingPuzzle(false);
      finishGenerationWorker(worker, requestId);
    };

    worker.onerror = (event) => {
      if (requestId !== activeGenerationRequestIdRef.current) {
        return;
      }

      setGenerationError(event.message || 'Puzzle generation worker failed.');
      setIsGeneratingPuzzle(false);
      finishGenerationWorker(worker, requestId);
    };

    worker.postMessage({
      type: 'generate',
      id: requestId,
      options: {
        maxAttempts: preset.maxAttempts,
        solveMaxVisited: preset.solveMaxVisited,
        solveMaxDepth: preset.solveMaxDepth,
        difficulty: {
          minDepth: preset.minDepth,
          maxDepth: preset.maxDepth,
        },
        allowRotation: true,
      },
    } satisfies PuzzleGeneratorWorkerRequest);
  };

  const handleCancelGeneration = () => {
    setIsPlayingSolution(false);
    const activeId = activeGenerationRequestIdRef.current;

    if (!activeId) {
      return;
    }

    generationWorkerRef.current?.postMessage({
      type: 'cancel',
      id: activeId,
    } satisfies PuzzleGeneratorWorkerRequest);
    generationWorkerRef.current?.terminate();
    generationWorkerRef.current = null;
    activeGenerationRequestIdRef.current = null;
    setIsGeneratingPuzzle(false);
  };

  const handleResetSamplePuzzle = () => {
    activateSamplePuzzle(selectedSamplePuzzleId);
  };

  const handleManualStepIndexChange: typeof setStepIndex = (action) => {
    setIsPlayingSolution(false);
    setStepIndex(action);
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-4 text-slate-950">
      <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-3">
            <h1 className="text-2xl font-semibold tracking-normal">Sliding Robot Lab</h1>
            <p className="mt-1 text-sm text-slate-600">
              BFS shortest-path analysis and search visualization
            </p>
          </div>

          <details className="mb-3 rounded border border-slate-300 bg-white text-sm shadow-sm">
            <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-slate-800">
              Puzzle Setup
              <span className="ml-2 text-xs font-normal text-slate-500">
                {puzzleSource}
              </span>
            </summary>
            <div className="border-t border-slate-200">
              <PuzzleControls
                puzzleSource={puzzleSource}
                samplePuzzles={samplePuzzles}
                selectedSamplePuzzleId={selectedSamplePuzzleId}
                difficultyPresets={PUZZLE_DIFFICULTY_PRESETS}
                selectedDifficulty={selectedDifficulty}
                generationInfo={generationInfo}
                generationError={generationError}
                isGeneratingPuzzle={isGeneratingPuzzle}
                isSolving={isSolving}
                onSelectSamplePuzzle={activateSamplePuzzle}
                onSelectDifficulty={setSelectedDifficulty}
                onGenerateRandom={handleGenerateRandomPuzzle}
                onCancelGeneration={handleCancelGeneration}
                onResetSample={handleResetSamplePuzzle}
              />
            </div>
          </details>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,auto)_330px]">
            <BoardView
              board={activeBoard}
              robots={currentRobots}
              targetRobot={activePuzzle.targetRobot}
              targetCell={activePuzzle.targetCell}
              heatmap={progress?.heatmap}
              sampledCells={progress?.sampledCells}
              maxHeat={progress?.maxHeat}
              currentMovePath={currentMovePath}
              activeMoveRobot={currentMove?.robot ?? null}
              editable={editorMode !== 'off' && !isSolving && !isGeneratingPuzzle}
              isCellEditable={canEditCell}
              onCellClick={handleEditorCellClick}
            />
            <SearchProgressPanel progress={progress} isSolving={isSolving} />
          </div>

          {workerError ? (
            <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {workerError}
            </div>
          ) : null}

          <PuzzleEditorPanel
            editorMode={editorMode}
            selectedEditorRobot={selectedEditorRobot}
            selectedWallDirection={selectedWallDirection}
            targetRobot={activePuzzle.targetRobot}
            disabled={isSolving || isGeneratingPuzzle}
            onEditorModeChange={setEditorMode}
            onSelectedEditorRobotChange={setSelectedEditorRobot}
            onSelectedWallDirectionChange={setSelectedWallDirection}
            onTargetRobotChange={handleTargetRobotChange}
          />

          <PuzzleSharePanel
            exportedJson={exportedJson}
            importText={importText}
            importError={importError}
            importSuccess={importSuccess}
            disabled={isSolving || isGeneratingPuzzle}
            onExport={handleExportPuzzle}
            onImportTextChange={setImportText}
            onImport={handleImportPuzzle}
          />
        </section>

        <SolutionPanel
          result={result}
          stepIndex={stepIndex}
          setStepIndex={handleManualStepIndexChange}
          onSolve={handleSolve}
          onCancel={handleCancel}
          isSolving={isSolving}
          isSolveDisabled={isGeneratingPuzzle}
          isPlaying={isPlayingSolution}
          playbackSpeed={playbackSpeed}
          onPlay={() => setIsPlayingSolution(true)}
          onPause={() => setIsPlayingSolution(false)}
          onSpeedChange={setPlaybackSpeed}
        />
      </div>
    </main>
  );
}
