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
};

export default function ScreenContainer({ children, style }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
