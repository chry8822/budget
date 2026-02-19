/**
 * 설정 페이지
 * - 다크 모드 스위치 등 앱 설정
 */

import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import ScreenContainer from '../components/common/ScreenContainer';
import ScreenHeader from '../components/common/ScreenHeader';
import { useColorScheme } from '../theme/ThemeContext';
import theme from '../theme';

export default function SettingsScreen() {
  const { theme, isDark, setColorScheme } = useColorScheme();

  return (
    <ScreenContainer>
      <ScreenHeader title="설정" />
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>다크 모드</Text>
        <Switch
          value={isDark}
          onValueChange={(value) => setColorScheme(value ? 'dark' : 'light')}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={theme.colors.primary}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    fontSize: 16,
  },
});
