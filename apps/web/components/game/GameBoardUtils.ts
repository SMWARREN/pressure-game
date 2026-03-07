/**
 * GameBoard utilities (DEPRECATED - use individual modules)
 * This file is maintained for backward compatibility.
 * New code should import from utils/ folder:
 * - utils/boardDimensions - Board size calculations
 * - utils/particleEffects - Particle burst animations
 * - utils/wallCompression - Wall status display
 * - utils/levelNavigation - Level sequencing
 * - utils/overlayProps - Win/loss overlay display
 */

// Re-export everything from specialized modules
export { computeBoardDimensions, computeGridDimensions } from './utils/boardDimensions';

export { getParticleBurstColor, getParticleBurstShape } from './utils/particleEffects';

export {
  getWallCompressionLabel,
  getWallCompressionColor,
  computeCompressionPercent,
} from './utils/wallCompression';

export {
  computeTimeStrings,
  computeLevelNavigation,
  computeLevelDisplayNum,
} from './utils/levelNavigation';

export { computeOverlayProps, type OverlayPropsContext } from './utils/overlayProps';
