/**
 * Status-based color utilities
 * Pure functions for computing colors based on game state
 */

/**
 * Get background color based on game status
 */
function getStatusBackgroundColor(status: string): string {
  switch (status) {
    case 'playing':
      return '#10b98120';
    case 'won':
      return '#22c55e20';
    case 'lost':
      return '#ef444420';
    default:
      return '#f59e0b20';
  }
}

/**
 * Get border color based on game status
 */
function getStatusBorderColor(status: string): string {
  switch (status) {
    case 'playing':
      return '#10b98140';
    case 'won':
      return '#22c55e40';
    case 'lost':
      return '#ef444440';
    default:
      return '#f59e0b40';
  }
}

/**
 * Get text color based on game status
 */
function getStatusTextColor(status: string): string {
  switch (status) {
    case 'playing':
      return '#10b981';
    case 'won':
      return '#22c55e';
    case 'lost':
      return '#ef4444';
    default:
      return '#f59e0b';
  }
}

/**
 * Get charge indicator color based on charge level
 */
function getChargeIndicator(
  charge: number,
  overloadThreshold: number = 8
): string {
  if (charge >= overloadThreshold) return '#ef4444'; // Red - overload
  if (charge >= overloadThreshold * 0.75) return '#f59e0b'; // Amber - warning
  if (charge >= overloadThreshold * 0.5) return '#fbbf24'; // Yellow - caution
  return '#3b82f6'; // Blue - normal
}

/**
 * Get step indicator background color
 */
function getStepBackground(
  step: number,
  currentStep: number,
  accentColor: string
): string {
  if (step === currentStep) return accentColor;
  if (step < currentStep) return '#3a3a55';
  return '#1a1a2e';
}

/**
 * Get cursor style based on editor mode and tile interactivity
 */
function getCursorStyle(
  editorMode: boolean,
  canRotate: boolean
): string {
  if (editorMode) return 'pointer';
  if (canRotate) return 'pointer';
  return 'default';
}

export {
  getStatusBackgroundColor,
  getStatusBorderColor,
  getStatusTextColor,
  getChargeIndicator,
  getStepBackground,
  getCursorStyle,
};
