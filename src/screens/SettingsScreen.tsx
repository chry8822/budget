/**
 * 설정 페이지
 * - 다크 모드 스위치, 전체 데이터 초기화
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Modal,
  Pressable,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import ScreenContainer from '../components/common/ScreenContainer';
import ScreenHeader from '../components/common/ScreenHeader';
import { useColorScheme } from '../theme/ThemeContext';
import { useTransactionChange } from '../components/common/TransactionChangeContext';
import { clearAllData } from '../db/database';
import Toast from 'react-native-toast-message';

export default function SettingsScreen() {
  const { theme, isDark, setColorScheme } = useColorScheme();
  const { notifyChanged } = useTransactionChange();
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetting, setResetting] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        label: {
          fontSize: theme.typography.sizes.md,
          color: theme.colors.text,
        },
        resetSection: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        resetButton: {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.colors.danger,
        },
        resetButtonText: {
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.danger,
          fontWeight: '600',
        },
        // 센터 확인 모달 (디자인 시스템)
        modalBackdrop: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing.lg,
        },
        modalCard: {
          width: '100%',
          maxWidth: 340,
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        modalTitle: {
          fontSize: theme.typography.sizes.xl,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: theme.spacing.sm,
          textAlign: 'center',
        },
        modalMessage: {
          fontSize: theme.typography.sizes.lg,
          color: theme.colors.textMuted,
          lineHeight: 25,
          marginBottom: theme.spacing.lg,
          textAlign: 'center',
        },
        modalMessageBold: {
          fontSize: theme.typography.sizes.lg,
          color: theme.colors.text,
          fontWeight: 'bold',
        },
        modalButtons: {
          flexDirection: 'row',
          gap: theme.spacing.sm,
        },
        modalButton: {
          flex: 1,
          paddingVertical: theme.spacing.sm,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        modalCancel: {
          backgroundColor: theme.colors.background,
        },
        modalConfirm: {
          backgroundColor: theme.colors.danger,
        },
        modalCancelText: {
          fontSize: theme.typography.sizes.md,
          color: theme.colors.text,
        },
        modalConfirmText: {
          fontSize: theme.typography.sizes.md,
          color: theme.colors.onPrimary ?? '#fff',
          fontWeight: '600',
        },
      }),
    [theme],
  );

  const handleResetPress = () => setResetModalVisible(true);
  const handleResetCancel = () => {
    if (!resetting) setResetModalVisible(false);
  };
  const handleResetConfirm = async () => {
    setResetting(true);
    try {
      await clearAllData();
      notifyChanged();
      setResetModalVisible(false);
      Vibration.vibrate();
      Toast.show({
        type: 'success',
        text1: '전체 데이터가 초기화되었어요.',
        onPress: () => Toast.hide(),
      });
    } catch (e) {
      console.error(e);
      Vibration.vibrate();
      Toast.show({
        type: 'error',
        text1: '초기화 중 오류가 발생했어요.',
        onPress: () => Toast.hide(),
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="설정" />
      <View style={styles.section}>
        <Text style={styles.label}>다크 모드</Text>
        <Switch
          value={isDark}
          onValueChange={(value) => setColorScheme(value ? 'dark' : 'light')}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={theme.colors.primary}
        />
      </View>
      <View style={styles.resetSection}>
        <Text style={styles.label}>전체 데이터 초기화</Text>
        <Pressable onPress={handleResetPress} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>초기화</Text>
        </Pressable>
      </View>

      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleResetCancel}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleResetCancel}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>전체 데이터 초기화</Text>
            <Text style={styles.modalMessage}>
              지금까지 기입한 가계부 데이터가 {'\n'}
              <Text style={styles.modalMessageBold}>모두 삭제됩니다.</Text>
              {'\n'}
              정말 초기화할까요?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalCancel]}
                onPress={handleResetCancel}
                disabled={resetting}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={handleResetConfirm}
                disabled={resetting}
              >
                {resetting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>초기화</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}
