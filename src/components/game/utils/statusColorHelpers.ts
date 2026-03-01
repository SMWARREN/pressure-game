/**
 * Status-based color utilities
 * Pure functions for computing colors based on game state
 */

// Status color lookup tables (reduces cognitive complexity vs switch statements)
const STATUS_BACKGROUND_COLORS: Record<string, string> = {
  playing: '#10b98120',
  won: '#22c55e20',
  lost: '#ef444420',
};

const STATUS_BORDER_COLORS: Record<string, string> = {
  playing: '#10b98140',
  won: '#22c55e40',
  lost: '#ef444440',
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  playing: '#10b981',
  won: '#22c55e',
  lost: '#ef4444',
};

/**
 * Get background color based on game status
 */
function getStatusBackgroundColor(status: string): string {
  return STATUS_BACKGROUND_COLORS[status] ?? '#f59e0b20';
}

/**
 * Get border color based on game status
 */
function getStatusBorderColor(status: string): string {
  return STATUS_BORDER_COLORS[status] ?? '#f59e0b40';
}

/**
 * Get text color based on game status
 */
function getStatusTextColor(status: string): string {
  return STATUS_TEXT_COLORS[status] ?? '#f59e0b';
}

/**
 * Get charge indicator color based on charge level
 */
function getChargeIndicator(charge: number, overloadThreshold: number = 8): string {
  if (charge >= overloadThreshold) return '#ef4444'; // Red - overload
  if (charge >= overloadThreshold * 0.75) return '#f59e0b'; // Amber - warning
  if (charge >= overloadThreshold * 0.5) return '#fbbf24'; // Yellow - caution
  return '#3b82f6'; // Blue - normal
}

/**
 * Get step indicator background color
 */
function getStepBackground(step: number, currentStep: number, accentColor: string): string {
  if (step === currentStep) return accentColor;
  if (step < currentStep) return '#3a3a55';
  return '#1a1a2e';
}

/**
 * Get cursor style based on editor mode and tile interactivity
 */
function getCursorStyle(editorMode: boolean, canRotate: boolean): string {
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
