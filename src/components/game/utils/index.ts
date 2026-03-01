/**
 * Game utilities
 * Re-exports all helper functions from focused modules
 */

// Tile rendering utilities
export {
  getConnColor,
  getConnGlow,
  getIndicatorColor,
  getHintIndicatorGlow,
  getNormalIndicatorGlow,
  getDecoyBorderColor,
  getDecoyBoxShadow,
  getNodeBorderColor,
  getPathBorderColor,
  type TileStyleContext,
} from './tileColorHelpers';

export {
  getTileTransform,
  getTileTransition,
  getOutbreakAnimation,
  getIconAnimation,
  getTileAnimation,
  getTileTransitionStyle,
} from './tileAnimationHelpers';

export { getSymbolSize, getGapValue, getPaddingValue } from './tileLayoutHelpers';

export {
  getStatusBackgroundColor,
  getStatusBorderColor,
  getStatusTextColor,
  getChargeIndicator,
  getStepBackground,
  getCursorStyle,
} from './statusColorHelpers';

export { getPipeSegmentStyle, type PipeSegmentStyle } from './pipeSegmentHelpers';

// GameBoard utilities
export { computeBoardDimensions, computeGridDimensions } from './boardDimensions';

export { getParticleBurstColor, getParticleBurstShape } from './particleEffects';

export {
  getWallCompressionLabel,
  getWallCompressionColor,
  computeCompressionPercent,
} from './wallCompression';

export {
  computeTimeStrings,
  computeLevelNavigation,
  computeLevelDisplayNum,
} from './levelNavigation';

export { computeOverlayProps, type OverlayPropsContext } from './overlayProps';
