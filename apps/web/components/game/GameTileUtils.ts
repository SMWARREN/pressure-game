/**
 * GameTile utilities (DEPRECATED - use individual modules)
 * This file is maintained for backward compatibility.
 * New code should import from utils/ folder:
 * - utils/tileColorHelpers - Color and glow calculations
 * - utils/tileAnimationHelpers - Animation and transform calculations
 * - utils/tileLayoutHelpers - Sizing and spacing calculations
 * - utils/statusColorHelpers - Status-based color calculations
 * - utils/pipeSegmentHelpers - Pipe rendering calculations
 */

// Re-export everything from specialized modules
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
  getTileBackgroundStyle,
  type TileStyleContext,
} from './utils/tileColorHelpers';

export {
  getTileTransform,
  getTileTransition,
  getOutbreakAnimation,
  getIconAnimation,
  getTileAnimation,
  getTileTransitionStyle,
} from './utils/tileAnimationHelpers';

export {
  getSymbolSize,
  getGapValue,
  getPaddingValue,
  calculateTileSize,
  calculateBoardWidth,
} from './utils/tileLayoutHelpers';

export {
  getStatusBackgroundColor,
  getStatusBorderColor,
  getStatusTextColor,
  getChargeIndicator,
  getStepBackground,
  getCursorStyle,
} from './utils/statusColorHelpers';

export { getPipeSegmentStyle, type PipeSegmentStyle } from './utils/pipeSegmentHelpers';
