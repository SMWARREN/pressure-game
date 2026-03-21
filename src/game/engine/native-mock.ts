/**
 * Native Mock Pressure Engine for React Native Development
 *
 * A simplified mock engine that returns sample game data.
 * This allows mobile development to proceed without complex logic.
 * Replace with real PressureEngine when ready.
 */

import type { IPressureEngine, EngineContext, PersistedState, WallAdvanceResult, SoundEffect } from './types';
import type { GameState, Level, Tile } from '../types';

/**
 * Create a 4x4 sample level for development
 */
function createSampleLevel(): Level {
  const tiles: Tile[] = [];
  let id = 0;

  // Create 4x4 grid with random rotations
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const tileTypes = ['straight', 'corner'] as const;
      const connections: ('up' | 'down' | 'left' | 'right')[] =
        Math.random() > 0.5
          ? ['up', 'down']  // straight
          : ['up', 'right']; // corner

      tiles.push({
        id,
        row,
        col,
        type: tileTypes[Math.floor(Math.random() * 2)],
        connections,
        rotation: Math.floor(Math.random() * 4),
        isGoal: Math.random() < 0.1, // 10% are goals
        isWall: row === 0, // Top row is walls
        displayData: {},
        canRotate: true,
      });
      id++;
    }
  }

  return {
    id: 1,
    title: 'Sample Level',
    width: 4,
    height: 4,
    tiles,
    wallCompression: 'optional',
    compressionDelay: 10000,
    maxMoves: null,
    goalNodes: [0, 5, 10], // Sample goal positions
  };
}

/**
 * Native mock engine - all methods are no-ops or return mock data
 */
export class NativeMockPressureEngine implements IPressureEngine {
  private sampleLevel: Level | null = null;

  init(getState: () => GameState, setState: (partial: Partial<GameState>) => void): void {
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

  persist(state: GameState): void {
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
