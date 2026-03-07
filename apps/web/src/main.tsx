import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useGameStore, destroyGameStore } from '@/game/store';
import '@/game/stats'; // bootstrap stats engine

// Expose store and utilities for E2E testing (detected by URL param, works in any build mode)
const isTestMode = new URLSearchParams(globalThis.location.search).has('levelId');
if (isTestMode) {
  (globalThis as any).__GAME_STORE__ = useGameStore;
  (globalThis as any).__DESTROY_GAME_STORE__ = destroyGameStore;
  // Note: Walkthrough disabling is now handled in TestHarness.tsx after engine initialization
}

// Cleanup timers on page unload/reload to prevent memory leaks and stale timers
globalThis.addEventListener('beforeunload', () => {
  destroyGameStore();
});

// Render app - engine will be created by GameEngineProvider
const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
