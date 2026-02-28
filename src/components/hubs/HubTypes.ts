// Shared types for hub screens

export interface MechanicRow {
  icon: string;
  label: string;
  detail: string;
}

// Pressure mode info (uses description instead of scoring)
export interface PressureModeInfo {
  description: string;
  mechanics: MechanicRow[];
  worlds: string;
}

// Arcade mode info (uses scoring formula)
export interface ArcadeModeInfo {
  scoreFormula: string;
  scoreNote: string;
  mechanics: MechanicRow[];
  worlds: string;
}
