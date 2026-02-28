// Shared style injection for hub screens
// Used by both PressureHubScreen and ArcadeHubScreen

let hubStylesInjected = false;

export function ensureHubStyles() {
  if (hubStylesInjected || typeof document === 'undefined') return;
  hubStylesInjected = true;

  const el = document.createElement('style');
  el.textContent = `
    /* Floating animation for sample tiles */
    @keyframes hubTileFloat {
      0%   { transform: translateY(0px);  }
      50%  { transform: translateY(-5px); }
      100% { transform: translateY(0px);  }
    }

    /* Info panel entrance */
    @keyframes hubInfoIn {
      from { opacity: 0; transform: scale(0.97); }
      to   { opacity: 1; transform: scale(1);    }
    }

    /* Pipe glow effect (pressure mode) */
    @keyframes hubPipeGlow {
      0%, 100% { filter: drop-shadow(0 0 3px currentColor); }
      50%      { filter: drop-shadow(0 0 6px currentColor); }
    }

    /* Pulse effect (pressure mode) */
    @keyframes hubPulse {
      0%, 100% { transform: scale(1); }
      50%      { transform: scale(1.02); }
    }

    /* Wall compression animation */
    @keyframes wallAdvance {
      0%   { transform: translateX(0) translateY(0); }
      100% { transform: translateX(0) translateY(0); }
    }

    /* Pressure wall approaching */
    @keyframes pressureWallApproach {
      0%   { opacity: 0.1; }
      50%  { opacity: 0.3; }
      100% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(el);
}
