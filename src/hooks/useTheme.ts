/**
 * useTheme - Access current theme and theme colors
 */
import { useGameStore } from '@/game/store';
import { getThemeColors, type Theme, type ThemeColors } from '@/utils/themeColors';

export interface UseThemeReturn {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

export function useTheme(): UseThemeReturn {
  const theme = useGameStore((s) => s.theme);
  const toggleTheme = useGameStore((s) => s.toggleTheme);
  const colors = getThemeColors(theme);

  return {
    theme,
    colors,
    toggleTheme,
  };
}
