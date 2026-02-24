/**
 * 테마 Context (라이트/다크)
 * - useTheme()로 현재 theme 조회
 * - setColorScheme으로 다크 모드 전환, AsyncStorage에 저장
 * - Android: 시스템 네비는 다크 모드 영향 없이 항상 기본(라이트) 색으로 고정
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

/** edge-to-edge 사용 시 setBackgroundColorAsync 미지원이므로 한 번 실패하면 더 이상 호출하지 않음 */
const navBarUnsupportedRef = { current: false };

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
    if (Platform.OS !== 'android' || navBarUnsupportedRef.current) return;
    try {
      await NavigationBar.setBackgroundColorAsync('#FFFFFF');
      await NavigationBar.setButtonStyleAsync('dark');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('edge-to-edge')) navBarUnsupportedRef.current = true;
    }
  }, []);

  // Android: 시스템 네비는 앱 다크 모드와 무관하게 항상 기본(라이트) 색 유지 (edge-to-edge 시 미호출)
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const delay = setTimeout(applyNavBarStyle, 100);
    return () => clearTimeout(delay);
  }, [colorScheme, applyNavBarStyle]);

  // 앱 포그라운드 복귀 시에도 시스템 네비 다시 적용 (edge-to-edge면 스킵)
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
