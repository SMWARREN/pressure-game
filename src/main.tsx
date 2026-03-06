import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useGameStore, destroyGameStore } from '@/game/store';
import '@/game/stats'; // bootstrap stats engine

// Expose store and utilities for E2E testing (detected by URL param, works in any build mode)
const isTestMode = new URLSearchParams(window.location.search).has('levelId');
if (isTestMode) {
  (window as any).__GAME_STORE__ = useGameStore;
  (window as any).__DESTROY_GAME_STORE__ = destroyGameStore;

  // Disable walkthroughs to prevent them from blocking test interactions
  const modes = ['classic', 'zen', 'blitz', 'candy', 'shoppingSpree', 'outbreak'];
  const levels = [1, 2, 3, 4, 5];
  for (const mode of modes) {
    for (const level of levels) {
      localStorage.setItem(`walkthrough-${mode}-${level}`, 'true');
    }
  }
}

// Cleanup timers on page unload/reload to prevent memory leaks and stale timers
window.addEventListener('beforeunload', () => {
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
