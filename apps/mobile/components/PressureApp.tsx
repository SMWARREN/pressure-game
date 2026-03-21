"use dom";

import React from 'react';
import App from '../../web/src/App';
import '@/game/stats'; // bootstrap stats engine
import '../../web/src/index.css'; // Import web app styles

// Apply base styles for DOM context
const domStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #06060f;
  }
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  #root {
    width: 100%;
    height: 100%;
  }
`;

export default function PressureApp() {
  // Inject styles into DOM context on mount
  React.useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = domStyles;
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, []);

  return <App />;
}
