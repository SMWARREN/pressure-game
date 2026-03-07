/**
 * Mobile app types
 * Shared TypeScript definitions for React Native components
 */

export interface GameLayoutDimensions {
  tileSize: number;
  gap: number;
  cols: number;
  rows: number;
}

export interface TouchTapEvent {
  x: number;
  y: number;
  timestamp: number;
}

export interface GameScreenState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
}
