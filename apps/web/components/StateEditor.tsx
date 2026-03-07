// PRESSURE - State Editor
// Debug tool for testing game mechanics by manipulating live game state
// Allows inspecting and modifying tiles, moves, time, compression, mode state, etc.
// Includes replay/step-through debugging similar to ReplayOverlay.

import React, { useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { usePresetManagement } from './hooks/useStateEditorLogic';
import { StateEditorContent } from './StateEditorContent';

// Extract state editor hooks for reduced complexity
function useStateEditorState() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [wasPausedByEditor, setWasPausedByEditor] = React.useState(false);

  return {
    isOpen,
    setIsOpen,
    message,
    setMessage,
    wasPausedByEditor,
    setWasPausedByEditor,
  };
}

export const StateEditor: React.FC = () => {
  // Only get what's needed for StateEditorContent
  const { isOpen, setIsOpen, message, setMessage, wasPausedByEditor, setWasPausedByEditor } =
    useStateEditorState();

  const { status } = useGameStore();
  const setState = useGameStore.setState;

  const { message: messageFromHook } = usePresetManagement();

  // Update message when hook message changes
  useEffect(() => {
    setMessage(messageFromHook);
  }, [messageFromHook, setMessage]);

  // Pause timer when editor opens, resume when it closes
  useEffect(() => {
    if (isOpen && status === 'playing' && !wasPausedByEditor) {
      setWasPausedByEditor(true);
      setState({ isPaused: true });
    } else if (!isOpen && wasPausedByEditor) {
      setWasPausedByEditor(false);
      setState({ isPaused: false });
    }
  }, [isOpen, status, wasPausedByEditor, setState, setWasPausedByEditor]);

  return <StateEditorContent isOpen={isOpen} setIsOpen={setIsOpen} message={message} />;
};

export default StateEditor;
