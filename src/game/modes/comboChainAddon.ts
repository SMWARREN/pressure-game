// PRESSURE - Combo Chain Addon
// Streak multiplier for consecutive successful taps

export interface ComboState {
  streak: number;
  multiplier: number;
}

export function resetCombo(): ComboState {
  return { streak: 0, multiplier: 1 };
}

export function updateCombo(prev: ComboState, groupSize: number): ComboState {
  // Only counts as a valid tap if group size >= 2
  if (groupSize < 2) {
    return resetCombo();
  }
  
  const newStreak = prev.streak + 1;
  // multiplier = min(1 + streak * 0.5, 3.0)
  const multiplier = Math.min(1 + newStreak * 0.5, 3.0);
  
  return { streak: newStreak, multiplier };
}

export function comboNotification(state: ComboState): string | null {
  if (state.streak >= 2) {
    return `🔥 COMBO x${state.multiplier.toFixed(1)}!`;
  }
  return null;
}