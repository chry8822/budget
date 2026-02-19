/**
 * Error Boundary 컴포넌트
 * - React 렌더링 에러 발생 시 앱 전체 크래시 방지
 * - 에러 화면을 보여주고 앱 재시작 유도
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

function ErrorView({ onReset }: { onReset: () => void }) {
  const theme = useTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          backgroundColor: theme.colors.background,
        },
        title: {
          fontSize: theme.typography.sizes.xl,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginTop: 16,
        },
        message: {
          fontSize: theme.typography.sizes.md,
          color: theme.colors.textMuted,
          textAlign: 'center',
          marginTop: 8,
          lineHeight: 22,
        },
        button: {
          marginTop: 24,
          backgroundColor: theme.colors.primary,
          paddingHorizontal: 32,
          paddingVertical: 12,
          borderRadius: 8,
        },
        buttonText: {
          color: theme.colors.onPrimary,
          fontSize: theme.typography.sizes.md,
          fontWeight: 'bold',
        },
      }),
    [theme],
  );
  return (
    <View style={styles.container}>
      <Ionicons name="bug-outline" size={64} color={theme.colors.primary} />
      <Text style={styles.title}>앗, 문제가 발생했어요</Text>
      <Text style={styles.message}>
        예상치 못한 오류가 발생했습니다.{'\n'}아래 버튼을 눌러 다시 시도해 주세요.
      </Text>
      <Pressable style={styles.button} onPress={onReset}>
        <Text style={styles.buttonText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorView onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}
