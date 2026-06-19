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
  Move,
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

type SearchFrame = {
  robots: RobotState;
  move?: Move;
};

type SearchPlaybackSpeed = 120 | 80 | 40 | 16;

const MAX_SEARCH_FRAME_QUEUE = 50_000;
const MAX_SEARCH_REPLAY_FRAMES = 50_000;
const PROGRESS_STATS_INTERVAL_MS = 80;

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
  const [precheckedResult, setPrecheckedResult] = useState<SolveResult | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlayingSolution, setIsPlayingSolution] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>('normal');
  const [editorMode, setEditorMode] = useState<EditorMode>('off');
  const [selectedEditorRobot, setSelectedEditorRobot] = useState<RobotColor>('red');
  const [selectedWallDirection, setSelectedWallDirection] = useState<Direction>('right');
  const [isSolving, setIsSolving] = useState(false);
  const [isShowingSearchFrames, setIsShowingSearchFrames] = useState(false);
  const [searchPlaybackSpeed, setSearchPlaybackSpeed] = useState<SearchPlaybackSpeed>(80);
  const [receivedSearchFrameCount, setReceivedSearchFrameCount] = useState(0);
  const [displayedSearchFrameCount, setDisplayedSearchFrameCount] = useState(0);
  const [droppedSearchFrameCount, setDroppedSearchFrameCount] = useState(0);
  const [progress, setProgress] = useState<SearchProgress | null>(null);
  const [searchFrame, setSearchFrame] = useState<SearchFrame | null>(null);
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [exportedJson, setExportedJson] = useState('');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const solveInFlightRef = useRef(false);
  const searchFrameQueueRef = useRef<SearchFrame[]>([]);
  const searchFrameReplayRef = useRef<SearchFrame[]>([]);
  const searchFrameAnimationRef = useRef<number | null>(null);
  const lastSearchFrameAtRef = useRef(0);
  const lastProgressStatsAtRef = useRef(0);
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
  const searchMovePath = useMemo(
    () =>
      isShowingSearchFrames && searchFrame?.move
        ? getMovePath(activeBoard, searchFrame.move)
        : null,
    [activeBoard, isShowingSearchFrames, searchFrame?.move]
  );
  const displayRobots =
    isShowingSearchFrames && searchFrame?.robots ? searchFrame.robots : currentRobots;
  const displayMovePath = searchMovePath ?? currentMovePath;
  const displayMoveRobot =
    isShowingSearchFrames && searchFrame?.move
      ? searchFrame.move.robot
      : currentMove?.robot ?? null;

  useEffect(() => {
    if (!isShowingSearchFrames) {
      if (searchFrameAnimationRef.current !== null) {
        cancelAnimationFrame(searchFrameAnimationRef.current);
        searchFrameAnimationRef.current = null;
      }
      return;
    }

    const tick = (timestamp: number) => {
      if (timestamp - lastSearchFrameAtRef.current >= searchPlaybackSpeed) {
        const nextFrame = searchFrameQueueRef.current.shift();

        if (nextFrame) {
          setSearchFrame(nextFrame);
          setDisplayedSearchFrameCount((current) => current + 1);
          lastSearchFrameAtRef.current = timestamp;
        }
      } else if (!isSolving) {
        setIsShowingSearchFrames(false);
        searchFrameAnimationRef.current = null;
        return;
      }

      searchFrameAnimationRef.current = requestAnimationFrame(tick);
    };

    searchFrameAnimationRef.current = requestAnimationFrame(tick);

    return () => {
      if (searchFrameAnimationRef.current !== null) {
        cancelAnimationFrame(searchFrameAnimationRef.current);
        searchFrameAnimationRef.current = null;
      }
    };
  }, [isShowingSearchFrames, isSolving, searchPlaybackSpeed]);

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

    solveInFlightRef.current = false;
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
    solveInFlightRef.current = false;
    setIsSolving(false);
    setIsShowingSearchFrames(false);
    searchFrameQueueRef.current = [];
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
    setPrecheckedResult(null);
    setProgress(null);
    setSearchFrame(null);
    setIsShowingSearchFrames(false);
    setReceivedSearchFrameCount(0);
    setDisplayedSearchFrameCount(0);
    setDroppedSearchFrameCount(0);
    searchFrameQueueRef.current = [];
    searchFrameReplayRef.current = [];
    lastSearchFrameAtRef.current = 0;
    lastProgressStatsAtRef.current = 0;
    setWorkerError(null);
    setStepIndex(0);
  };

  const createSearchVisualFrames = (nextProgress: SearchProgress): SearchFrame[] => {
    const currentRobots = nextProgress.currentRobots;
    const currentMove = nextProgress.currentMove;

    if (!currentRobots) {
      return [];
    }

    if (!currentMove) {
      return [
        {
          robots: currentRobots,
        },
      ];
    }

    try {
      const path = getMovePath(activeBoard, currentMove);

      return path.cells.map((cell) => ({
        robots: {
          ...currentRobots,
          [currentMove.robot]: cell,
        },
        move: currentMove,
      }));
    } catch {
      return [
        {
          robots: currentRobots,
          move: currentMove,
        },
      ];
    }
  };

  const enqueueSearchFrame = (nextProgress: SearchProgress) => {
    if (!nextProgress.currentRobots) {
      return;
    }

    const visualFrames = createSearchVisualFrames(nextProgress);

    if (visualFrames.length === 0) {
      return;
    }

    searchFrameQueueRef.current.push(...visualFrames);
    searchFrameReplayRef.current.push(...visualFrames);
    setReceivedSearchFrameCount((current) => current + 1);

    if (searchFrameReplayRef.current.length > MAX_SEARCH_REPLAY_FRAMES) {
      searchFrameReplayRef.current.splice(
        0,
        searchFrameReplayRef.current.length - MAX_SEARCH_REPLAY_FRAMES
      );
    }

    if (searchFrameQueueRef.current.length > MAX_SEARCH_FRAME_QUEUE) {
      const dropCount = searchFrameQueueRef.current.length - MAX_SEARCH_FRAME_QUEUE;
      setDroppedSearchFrameCount((current) => current + dropCount);
      searchFrameQueueRef.current.splice(
        0,
        dropCount
      );
    }
  };

  const handleReplaySearchFrames = () => {
    if (searchFrameReplayRef.current.length === 0) {
      return;
    }

    setIsPlayingSolution(false);
    searchFrameQueueRef.current = searchFrameReplayRef.current.map((frame) => ({
      robots: frame.robots,
      move: frame.move,
    }));
    const firstFrame = searchFrameQueueRef.current.shift() ?? null;
    setSearchFrame(firstFrame);
    setDisplayedSearchFrameCount(firstFrame ? 1 : 0);
    setDroppedSearchFrameCount(0);
    setIsShowingSearchFrames(true);
    lastSearchFrameAtRef.current = 0;
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
    setPrecheckedResult(null);
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
    setPrecheckedResult(null);
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
    setPrecheckedResult(null);
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
      setPrecheckedResult(null);
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
    if (solveInFlightRef.current || isSolving || isGeneratingPuzzle) {
      return;
    }

    solveInFlightRef.current = true;
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
    let worker: Worker;

    try {
      worker = new Worker(new URL('../features/puzzle/solverWorker.ts', import.meta.url), {
        type: 'module',
      });
    } catch (error) {
      solveInFlightRef.current = false;
      setIsSolving(false);
      setWorkerError(error instanceof Error ? error.message : 'Solver worker failed to start.');
      return;
    }

    workerRef.current = worker;
    activeRequestIdRef.current = requestId;
    setResult(null);
    setProgress(null);
    setSearchFrame(null);
    setIsShowingSearchFrames(true);
    setReceivedSearchFrameCount(0);
    setDisplayedSearchFrameCount(0);
    setDroppedSearchFrameCount(0);
    searchFrameQueueRef.current = [];
    searchFrameReplayRef.current = [];
    lastSearchFrameAtRef.current = 0;
    lastProgressStatsAtRef.current = 0;
    setWorkerError(null);
    setIsSolving(true);
    setStepIndex(0);

    worker.onmessage = (event: MessageEvent<SolverWorkerResponse>) => {
      const message = event.data;

      if (message.id !== activeRequestIdRef.current) {
        return;
      }

      if (message.type === 'progress') {
        enqueueSearchFrame(message.progress);

        const now = performance.now();
        const shouldUpdateStats =
          message.progress.status !== 'running' ||
          now - lastProgressStatsAtRef.current >= PROGRESS_STATS_INTERVAL_MS;

        if (shouldUpdateStats) {
          setProgress(message.progress);
          lastProgressStatsAtRef.current = now;
        }

        if (message.progress.status !== 'running' && message.progress.currentRobots) {
          setSearchFrame({
            robots: message.progress.currentRobots,
            move: message.progress.currentMove,
          });
        }
        return;
      }

      if (message.type === 'result') {
        const displayResult =
          message.result.found || message.result.reason === 'cancelled'
            ? message.result
            : precheckedResult ?? message.result;

        setResult(displayResult);
        setProgress((currentProgress) =>
          currentProgress
            ? {
                ...currentProgress,
                status: displayResult.found
                  ? 'solved'
                  : message.result.reason ?? 'notFound',
                visitedCount: message.result.visitedCount,
                depth: displayResult.depth,
                frontierSize: 0,
                message: displayResult.found
                  ? message.result.found
                    ? `Solved at depth ${displayResult.depth}.`
                    : `Search ended: ${message.result.reason ?? 'notFound'}. Showing prechecked solution at depth ${displayResult.depth}.`
                  : `Search ended: ${message.result.reason ?? 'notFound'}.`,
              }
            : currentProgress
        );
        setIsSolving(false);
        setStepIndex(0);
        finishActiveWorker(worker, requestId);
        return;
      }

      if (precheckedResult?.found) {
        setResult(precheckedResult);
        setWorkerError(`${message.message}. Showing prechecked solution.`);
      } else {
        setWorkerError(message.message);
      }
      setIsSolving(false);
      setStepIndex(0);
      finishActiveWorker(worker, requestId);
    };

    worker.onerror = (event) => {
      if (requestId !== activeRequestIdRef.current) {
        return;
      }

      if (precheckedResult?.found) {
        setResult(precheckedResult);
        setWorkerError(`${event.message || 'Solver worker failed.'} Showing prechecked solution.`);
      } else {
        setWorkerError(event.message || 'Solver worker failed.');
      }
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
        maxVisited: 1_000_000,
        maxDepth: 50,
        maxQueueSize: 1_000_000,
        chunkSize: 1,
        progressInterval: 1,
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
        setPrecheckedResult(message.result.solution);
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
    <main className="min-h-screen bg-slate-100 px-3 py-3 text-slate-950 sm:px-4">
      <div className="mx-auto max-w-[1680px]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Sliding Robot Lab</h1>
            <p className="mt-1 text-sm text-slate-600">
              BFS search visualization first. Tools stay collapsed below.
            </p>
          </div>
          <div className="rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
            Current puzzle: <span className="font-semibold text-slate-900">{puzzleSource}</span>
            {generationInfo?.solutionDepth ? (
              <span className="ml-2">verified depth {generationInfo.solutionDepth}</span>
            ) : null}
          </div>
        </div>

        <section className="grid items-start gap-3 xl:grid-cols-[minmax(520px,780px)_minmax(300px,390px)_340px]">
          <div className="rounded border border-slate-300 bg-white p-2 shadow-sm">
            <BoardView
              board={activeBoard}
              robots={displayRobots}
              targetRobot={activePuzzle.targetRobot}
              targetCell={activePuzzle.targetCell}
              heatmap={progress?.heatmap}
              sampledCells={progress?.sampledCells}
              maxHeat={progress?.maxHeat}
              currentMovePath={displayMovePath}
              activeMoveRobot={displayMoveRobot}
              editable={editorMode !== 'off' && !isSolving && !isGeneratingPuzzle}
              isCellEditable={canEditCell}
              onCellClick={handleEditorCellClick}
            />
          </div>
          <SearchProgressPanel
            progress={progress}
            isSolving={isSolving || isShowingSearchFrames}
            currentMove={searchFrame?.move}
            frameQueueSize={searchFrameQueueRef.current.length}
            receivedFrameCount={receivedSearchFrameCount}
            displayedFrameCount={displayedSearchFrameCount}
            droppedFrameCount={droppedSearchFrameCount}
            playbackSpeed={searchPlaybackSpeed}
            onPlaybackSpeedChange={setSearchPlaybackSpeed}
            canReplay={searchFrameReplayRef.current.length > 0}
            replayFrameCount={searchFrameReplayRef.current.length}
            onReplay={handleReplaySearchFrames}
          />
          <SolutionPanel
            board={activeBoard}
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
        </section>

        {workerError ? (
          <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {workerError}
          </div>
        ) : null}

        <section className="mt-3 grid gap-3 lg:grid-cols-2">
          <details className="rounded border border-slate-300 bg-white text-sm shadow-sm">
            <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-slate-800">
              Puzzle Setup
              <span className="ml-2 text-xs font-normal text-slate-500">
                sample/random/difficulty
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
      </div>
    </main>
  );
}
