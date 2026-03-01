/**
 * Conditional Style Helpers
 *
 * Eliminates nested ternaries by consolidating common patterns.
 * Patterns: `condition1 ? optionA : condition2 ? optionB : optionC`
 */

/**
 * Select value from a priority list of conditions
 * Evaluates conditions in order, returns first matching value
 *
 * @example
 * const color = selectByCondition(
 *   [isHint, '#60a5fa'],
 *   [inDanger, '#ef4444'],
 *   [undefined, '#3b82f6'] // fallback
 * )
 */
export function selectByCondition<T>(
  ...options: Array<[boolean | undefined, T]>
): T {
  for (const [condition, value] of options) {
    if (condition) return value;
  }
  // Return last option as fallback
  return options[options.length - 1][1];
}

/**
 * Select color based on state flags
 */
export function getStateColor(
  isHint: boolean,
  inDanger: boolean,
  hintColor: string,
  dangerColor: string,
  normalColor: string
): string {
  return selectByCondition(
    [isHint, hintColor],
    [inDanger, dangerColor],
    [true, normalColor]
  );
}

/**
 * Pick a random item from an array
 * Replaces the common pattern: array[Math.floor(Math.random() * array.length)]
 */
export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Clamp a value between min and max boundaries
 * Replaces: Math.max(min, Math.min(max, value))
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Nullish coalescing with fallback function
 * Useful when the fallback is expensive to compute
 */
export function coalesce<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback;
}

/**
 * Check if array/set is not empty
 * Replaces: array.length > 0 or set.size > 0
 */
export function isNotEmpty<T>(collection: T[] | Set<T> | null | undefined): boolean {
  if (!collection) return false;
  return collection instanceof Set ? collection.size > 0 : collection.length > 0;
}

/**
 * Check if array/set is empty
 * Replaces: array.length === 0 or set.size === 0
 */
export function isEmpty<T>(collection: T[] | Set<T> | null | undefined): boolean {
  return !isNotEmpty(collection);
}
