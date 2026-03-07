// Extracted handlers and callbacks for StateEditor to reduce main component complexity

import { useCallback } from 'react';
import { CompressionDirection } from '@/game/types';

export function useStateEditorHandlers(props: any) {
  const {
    setState,
    showMessage,
    captureDebugSnapshot,
    buildExportData,
    debugHistory,
    debugStep,
    setDebugHistory,
    setDebugStep,
    setDebugPlaying,
    currentLevel,
  } = props;

  // Export state as JSON
  const exportState = useCallback(() => {
    const stateData = buildExportData();
    const json = JSON.stringify(stateData, null, 2);
    navigator.clipboard.writeText(json);
    showMessage('State copied to clipboard!');
  }, [buildExportData, showMessage]);

  // Go to specific debug step
  const goToDebugStep = useCallback(
    (step: number) => {
      if (step < 0 || step >= debugHistory.length) return;
      const snapshot = debugHistory[step];
      setState({
        tiles: snapshot.tiles,
        moves: snapshot.moves,
        score: snapshot.score,
      });
      setDebugStep(step);
      setDebugPlaying(false);
    },
    [debugHistory, setState, setDebugStep, setDebugPlaying]
  );

  // Step forward/backward
  const stepBackward = useCallback(() => {
    if (debugStep && debugStep > 0) goToDebugStep(debugStep - 1);
  }, [debugStep, goToDebugStep]);

  const stepForward = useCallback(() => {
    if (debugStep !== undefined && debugStep < debugHistory.length - 1)
      goToDebugStep(debugStep + 1);
  }, [debugStep, debugHistory.length, goToDebugStep]);

  // Clear debug history
  const clearDebugHistory = useCallback(() => {
    setDebugHistory([]);
    setDebugStep(-1);
    setDebugPlaying(false);
    showMessage('Debug history cleared');
  }, [showMessage, setDebugHistory, setDebugStep, setDebugPlaying]);

  // Trigger Win/Lose
  const triggerWin = useCallback(() => {
    setState({ status: 'won', showingWin: true });
    showMessage('Triggered WIN state');
    captureDebugSnapshot('Triggered WIN');
  }, [setState, showMessage, captureDebugSnapshot]);

  const triggerLose = useCallback(
    (reason?: string) => {
      setState({ status: 'lost', lossReason: reason ?? 'Debug triggered' });
      showMessage('Triggered LOSE state');
      captureDebugSnapshot('Triggered LOSE');
    },
    [setState, showMessage, captureDebugSnapshot]
  );

  // Compression Direction
  const setCompressionDirection = useCallback(
    (dir: CompressionDirection) => {
      if (!currentLevel) return;
      const updatedLevel = { ...currentLevel, compressionDirection: dir };
      setState({ currentLevel: updatedLevel });
      showMessage(`Compression: ${dir}`);
    },
    [currentLevel, setState, showMessage]
  );

  return {
    exportState,
    goToDebugStep,
    stepBackward,
    stepForward,
    clearDebugHistory,
    triggerWin,
    triggerLose,
    setCompressionDirection,
  };
}
