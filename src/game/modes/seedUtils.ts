/**
 * PRESSURE - Seeded Random Number Generator (mulberry32)
 * Shared utility for reproducible level generation across all modes.
 * https://stackoverflow.com/a/47593316/2259251
 */

/**
 * Mulberry32 seeded PRNG - returns a function that generates
 * deterministic random numbers in range [0, 1).
 * Used for reproducible level generation across restarts.
 */
export function seededRandom(seed: number): () => number {
  let s = seed;
  return (): number => {
    s = Math.trunc(s);
    s = Math.trunc(s + 0x6d2b79f5);
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
