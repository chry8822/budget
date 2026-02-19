/**
 * 화면 공통 레이아웃 컴포넌트
 * - SafeAreaView + 기본 배경색/패딩 적용
 * - 모든 페이지에서 공통으로 사용
 * - useTheme 사용으로 다크모드 시 배경 자동 반영
 */

import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

type ScreenContainerProps = {
  children: ReactNode;
  style?: ViewStyle;
  /** 하단 Safe Area 적용 여부 (기본: false, Stack 화면에서 true 사용) */
  safeBottom?: boolean;
};

export default function ScreenContainer({ children, style, safeBottom = false }: ScreenContainerProps) {
  const theme = useTheme();
  const edges: ('top' | 'left' | 'right' | 'bottom')[] = ['top', 'left', 'right'];
  if (safeBottom) edges.push('bottom');

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background, paddingTop: theme.spacing.md }]}
      edges={edges}
    >
      <View style={[styles.inner, { paddingHorizontal: theme.spacing.md }, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});
