import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useGameStore, destroyGameStore } from '@/game/store';
import '@/game/stats'; // bootstrap stats engine

// Performance monitoring and test utilities
if (process.env.NODE_ENV !== 'production') {
  const isTestMode = new URLSearchParams(window.location.search).has('levelId');
  if (isTestMode) {
    performance.mark('main-start');
  }

  // Expose destroy function for E2E test cleanup
  (window as any).__DESTROY_GAME_STORE__ = destroyGameStore;
}

// Expose store for E2E testing and disable walkthrough in test mode
if (process.env.NODE_ENV !== 'production') {
  (window as any).__GAME_STORE__ = useGameStore;

  // Disable walkthroughs in test mode (E2E tests with ?levelId=X)
  const isTestMode = new URLSearchParams(window.location.search).has('levelId');
  if (isTestMode) {
    // Mark all common walkthroughs as seen to prevent them from showing
    const modes = ['classic', 'zen', 'blitz', 'candy', 'shoppingSpree', 'outbreak'];
    const levels = [1, 2, 3, 4, 5]; // First few levels often have walkthroughs
    for (const mode of modes) {
      for (const level of levels) {
        localStorage.setItem(`walkthrough-${mode}-${level}`, 'true');
      }
    }
  }
}

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
