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
 * Select from two options based on condition (ternary replacement)
 */
export function selectStyle<T>(condition: boolean, trueValue: T, falseValue: T): T {
  return condition ? trueValue : falseValue;
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
