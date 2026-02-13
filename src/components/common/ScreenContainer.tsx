/**
 * 화면 공통 레이아웃 컴포넌트
 * - SafeAreaView + 기본 배경색/패딩 적용
 * - 모든 페이지에서 공통으로 사용
 */

import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

type ScreenContainerProps = {
  children: ReactNode;
  style?: ViewStyle;
  /** 하단 Safe Area 적용 여부 (기본: false, Stack 화면에서 true 사용) */
  safeBottom?: boolean;
};

export default function ScreenContainer({ children, style, safeBottom = false }: ScreenContainerProps) {
  const edges: ('top' | 'left' | 'right' | 'bottom')[] = ['top', 'left', 'right'];
  if (safeBottom) edges.push('bottom');

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <View style={[styles.inner, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
