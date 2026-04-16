/**
 * 테마 Context (라이트/다크)
 * - useTheme()로 현재 theme 조회
 * - setColorScheme으로 다크 모드 전환, AsyncStorage에 저장
 * - Android: 시스템 네비 — edge-to-edge 대응(setStyle + 버튼 스타일), 배경색 API는 사용하지 않음
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 패키지 main이 src/index.ts라 Metro에서 해석 실패 → 빌드된 진입점 사용
import * as NavigationBar from 'expo-navigation-bar/build';
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

/**
 * Android 15+ / edge-to-edge 기본값에서는 setBackgroundColorAsync가 지원되지 않아 경고가 남음.
 * expo-navigation-bar 권장: edge-to-edge일 때는 setStyle 사용.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((value) => {
      if (value === 'dark' || value === 'light') {
        setColorSchemeState(value);
      }
    });
  }, []);

  const applyNavBarStyle = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      NavigationBar.setStyle('light');
    } catch {
      /* noop */
    }
    try {
      await NavigationBar.setButtonStyleAsync('dark');
    } catch {
      /* noop */
    }
  }, []);

  // Android: 시스템 네비 — edge-to-edge면 setStyle, 아니면 배경+버튼
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const delay = setTimeout(applyNavBarStyle, 100);
    return () => clearTimeout(delay);
  }, [colorScheme, applyNavBarStyle]);

  // 앱 포그라운드 복귀 시에도 시스템 네비 다시 적용
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') applyNavBarStyle();
    });
    return () => sub.remove();
  }, [applyNavBarStyle]);

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
