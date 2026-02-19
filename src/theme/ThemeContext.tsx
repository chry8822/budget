/**
 * 테마 Context (라이트/다크)
 * - useTheme()로 현재 theme 조회
 * - setColorScheme으로 다크 모드 전환, AsyncStorage에 저장
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colorsLight from './colorsLight';
import colorsDark from './colorsDark';
import spacing from './spacing';
import { getTypography } from './typography';
import type { AppTheme } from './index';

const THEME_STORAGE_KEY = 'app_color_scheme';

type ColorScheme = 'light' | 'dark';

type ThemeContextValue = {
  theme: AppTheme;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
};

const defaultTheme: AppTheme = {
  colors: colorsLight,
  spacing,
  typography: getTypography(colorsLight),
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  colorScheme: 'light',
  setColorScheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((value) => {
      if (value === 'dark' || value === 'light') {
        setColorSchemeState(value);
      }
    });
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
  }, []);

  const colors = colorScheme === 'dark' ? colorsDark : colorsLight;
  const theme: AppTheme = {
    colors,
    spacing,
    typography: getTypography(colors),
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorScheme,
        setColorScheme,
        isDark: colorScheme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): AppTheme {
  const { theme } = useContext(ThemeContext);
  return theme;
}

export function useColorScheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
