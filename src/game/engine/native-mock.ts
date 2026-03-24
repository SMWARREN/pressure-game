/**
 * Native Mock Pressure Engine for React Native Development
 *
 * A simplified mock engine that returns sample game data.
 * This allows mobile development to proceed without complex logic.
 * Replace with real PressureEngine when ready.
 */

import type { IPressureEngine, PersistedState, WallAdvanceResult, SoundEffect } from './types';
import type { GameState, Level, Position, Tile } from '../types';

/**
 * Create a 4x4 sample level for development
 */
function createSampleLevel(): Level {
  const tiles: Tile[] = [];
  let idCounter = 0;

  // Create 4x4 grid with random rotations
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const connections: ('up' | 'down' | 'left' | 'right')[] =
        Math.random() > 0.5
          ? ['up', 'down'] // straight
          : ['up', 'right']; // corner

      tiles.push({
        id: String(idCounter),
        x,
        y,
        type: 'path',
        connections,
        isGoalNode: Math.random() < 0.1,
        canRotate: true,
      });
      idCounter++;
    }
  }

  const goalNodes: Position[] = [
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 1, y: 3 },
  ];

  return {
    id: 1,
    name: 'Sample Level',
    world: 1,
    gridSize: 4,
    tiles,
    compressionDelay: 10000,
    maxMoves: 0,
    goalNodes,
  };
}

/**
 * Native mock engine - all methods are no-ops or return mock data
 */
export class NativeMockPressureEngine implements IPressureEngine {
  private sampleLevel: Level | null = null;

  init(_getState: () => GameState, setState: (partial: Partial<GameState>) => void): void {
    // Initialize with sample level
    this.sampleLevel = createSampleLevel();

    setState({
      status: 'menu',
      currentLevel: this.sampleLevel,
      currentModeId: 'classic',
    });
  }

  destroy(): void {
    // No cleanup needed
  }

  startTimer(): void {
    // No-op
  }

  stopTimer(): void {
    // No-op
  }

  clearTimers(): void {
    // No-op
  }

  onTick(): Partial<GameState> | null {
    // No-op
    return null;
  }

  playSound(name: SoundEffect): void {
    console.log(`[Mock SFX] ${name}`);
  }

  setAudioEnabled(enabled: boolean): void {
    console.log(`[Mock Audio] ${enabled ? 'enabled' : 'disabled'}`);
  }

  loadPersisted(): PersistedState {
    return {
      completedLevels: [],
      bestMoves: {},
      bestTimes: {},
      showTutorial: true,
      generatedLevels: [],
      currentModeId: 'classic',
      seenTutorials: [],
      animationsEnabled: true,
      theme: 'dark',
      lastPlayedLevelId: {},
      editorEnabled: false,
    };
  }

  persist(_state: GameState): void {
    // No-op - don't save in mock mode
  }

  advanceWalls(): WallAdvanceResult | null {
    // No compression in mock mode
    return null;
  }

  resolveCompressionEnabled(): boolean {
    return false;
  }

  isWalkthroughSeen(): boolean {
    return false;
  }

  markWalkthroughSeen(): void {
    // No-op
  }

  resetWalkthrough(): void {
    // No-op
  }

  markAllWalkthroughsSeen(): void {
    // No-op
  }

  getHighScore(): number | null {
    return null;
  }

  setHighScore(): void {
    // No-op
  }

  getEditorPresets(): unknown[] {
    return [];
  }
}

/**
 * Create a mock engine instance
 */
export function createNativeMockEngine(): IPressureEngine {
  return new NativeMockPressureEngine();
}
