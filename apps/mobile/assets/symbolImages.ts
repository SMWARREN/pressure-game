import { ImageSourcePropType } from 'react-native';

/**
 * Maps emoji characters used as tile symbols to their PNG assets.
 * Falls back to <Text> rendering for any symbol not in this map.
 */
export const SYMBOL_IMAGES: Record<string, ImageSourcePropType> = {
  // Candy
  '🍎': require('./tile-apple.png'),
  '🍊': require('./tile-orange.png'),
  '🍋': require('./tile-lemon.png'),
  '🫐': require('./tile-blueberry.png'),
  '🍓': require('./tile-strawberry.png'),
  '🍇': require('./tile-grapes.png'),
  '🥝': require('./tile-kiwi.png'),
  '🍒': require('./tile-cherries.png'),
  '🥭': require('./tile-mango.png'),
  '🍑': require('./tile-peach.png'),
  '🍍': require('./tile-pineapple.png'),
  '🧊': require('./tile-ice.png'),
  '⭐': require('./tile-star.png'),
  // Shopping Spree
  '👗': require('./tile-dress.png'),
  '👠': require('./tile-heel.png'),
  '👜': require('./tile-bag.png'),
  '💄': require('./tile-lipstick.png'),
  // Gem Blast
  '💍': require('./tile-ring.png'),
  '🔮': require('./tile-crystal.png'),
  '🟣': require('./tile-purple.png'),
  '🔵': require('./tile-blue.png'),
  // Shared
  '💎': require('./emoji-gem.png'),
  '💣': require('./emoji-fuse.png'),
  '🌊': require('./emoji-gravity.png'),
  // Memory Match / Fuse shared
  '🌟': require('./tile-glowstar.png'),
  '🎵': require('./tile-music.png'),
  '🎯': require('./tile-target.png'),
  '🌈': require('./tile-rainbow.png'),
  '🔥': require('./tile-fire.png'),
  '🍀': require('./tile-clover.png'),
  '🎪': require('./tile-circus.png'),
  '🦋': require('./tile-butterfly.png'),
  '🌺': require('./tile-flower.png'),
  '🦁': require('./tile-lion.png'),
  '🐬': require('./tile-dolphin.png'),
  '🌙': require('./tile-moon.png'),
  '⚡': require('./tile-lightning.png'),
  '🎸': require('./tile-guitar.png'),
  '🏆': require('./tile-trophy.png'),
  '🦄': require('./tile-unicorn.png'),
  '🎭': require('./tile-theater.png'),
  '🍄': require('./tile-mushroom.png'),
  '🎲': require('./tile-dice.png'),
  '🧩': require('./tile-puzzle.png'),
  '🌋': require('./tile-volcano.png'),
  '🦅': require('./tile-eagle.png'),
  '💫': require('./tile-sparkle.png'),
  '🌠': require('./tile-shootingstar.png'),
  '🦊': require('./tile-fox.png'),
  '💡': require('./tile-bulb.png'),
  '🌍': require('./tile-earth.png'),
  '🎨': require('./tile-palette.png'),
  '🏔️': require('./tile-mountain.png'),
  // Feature indicator icons
  '🌧️': require('./tile-rain.png'),
  '🦹': require('./tile-thief.png'),
  // World icons — Shopping Spree
  '🛍️': require('./world-shoppingbags.png'),
  '🏬': require('./world-store.png'),
  '👑': require('./world-crown.png'),
  '♾️': require('./world-infinity.png'),
  // World icons — Candy
  '🍬': require('./world-candy.png'),
  '🍭': require('./world-lollipop.png'),
  '🍫': require('./world-chocolate.png'),
  '❄️': require('./world-snowflake.png'),
  '🌴': require('./world-palmtree.png'),
  // World icons — Gravity Drop
  '🔢': require('./world-numbers.png'),
  '🌑': require('./world-newmoon.png'),
  // World icons — Fuse
  '🧨': require('./world-firecracker.png'),
  '💥': require('./world-explosion.png'),
  // World icons — Laser Relay
  '🔦': require('./world-flashlight.png'),
  '🔷': require('./world-bluediamond.png'),
  '🌀': require('./world-cyclone.png'),
  // World icons — Outbreak
  '🦠': require('./emoji-outbreak.png'),
  '🧫': require('./world-petridish.png'),
  '⚗️': require('./world-alembic.png'),
  '🔬': require('./world-microscope.png'),
  // World icons — Voltage
  '🔋': require('./world-battery.png'),
  // World icons — Mirror Forge
  '🪞': require('./emoji-mirror.png'),
  // World icons — Memory Match
  '🧠': require('./emoji-memory.png'),
  // World icons — Quantum Chain
  '🔗': require('./emoji-quantum.png'),
};
