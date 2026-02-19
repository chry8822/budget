/**
 * 예산 설정 페이지
 * - 월 총 예산 및 카테고리별 예산 설정
 * - 예산 초과 경고, 진동 피드백
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Animated,
  TouchableOpacity,
  Vibration,
  Platform,
} from 'react-native';
import ScreenContainer from '../components/common/ScreenContainer';
import ScreenHeader from '../components/common/ScreenHeader';
import { useTheme } from '../theme/ThemeContext';
import { deleteBudget, getBudgetsOfMonth, upsertBudget } from '../db/database';
import { EXPENSE_MAIN_CATEGORIES, MAIN_CATEGORIES } from '../types/transaction';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { formatWon } from '../utils/format';

import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetSetting'>;

export default function BudgetSettingScreen({ route }: Props) {
  const theme = useTheme();
  const now = new Date();
  const year = route.params?.year ?? now.getFullYear();
  const month = route.params?.month ?? now.getMonth() + 1;

  const [loading, setLoading] = useState(false);
  const [totalBudget, setTotalBudget] = useState<string>(''); // 문자열로 관리
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({}); // 카테고리별 금액

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        title: {
          fontSize: theme.typography.title.fontSize,
          fontWeight: 'bold',
          marginBottom: theme.spacing.sm,
          color: theme.colors.text,
        },
        subtitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.md,
        },
        subtitle: {
          flex: 1,
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.textMuted,
        },
        card: {
          padding: theme.spacing.md,
          borderRadius: 12,
          backgroundColor: theme.colors.surface,
          marginBottom: theme.spacing.md,
        },
        cardTitle: {
          fontSize: theme.typography.sizes.md,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: theme.spacing.sm,
        },
        cardHint: {
          marginTop: theme.spacing.xs,
          fontSize: theme.typography.sizes.xs,
          color: theme.colors.textMuted,
        },
        inputRow: { flexDirection: 'row', alignItems: 'center' },
        input: {
          flex: 1,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          paddingVertical: 4,
          fontSize: theme.typography.sizes.md,
          color: theme.colors.text,
        },
        inputSuffix: {
          marginLeft: theme.spacing.xs,
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.text,
        },
        categoryRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: theme.spacing.xs,
        },
        categoryLabel: {
          flex: 1,
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.text,
        },
        categoryInputRow: {
          flexDirection: 'row',
          alignItems: 'center',
          minWidth: 120,
          justifyContent: 'flex-end',
        },
        categoryInput: {
          minWidth: 80,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          textAlign: 'right',
          paddingVertical: 2,
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.text,
        },
        saveButton: {
          marginTop: theme.spacing.sm,
          marginBottom: theme.spacing.xl,
          paddingVertical: theme.spacing.md,
          borderRadius: 999,
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
        },
        saveButtonDisabled: { opacity: 0.6 },
        saveButtonText: {
          fontSize: theme.typography.sizes.md,
          fontWeight: 'bold',
          color: theme.colors.onPrimary,
        },
        shakeWrap: { flex: 1 },
        summaryBox: {
          marginTop: theme.spacing.md,
          padding: theme.spacing.sm,
          borderRadius: 8,
          backgroundColor: theme.colors.surface,
        },
        summaryTitle: {
          fontSize: theme.typography.sizes.sm,
          fontWeight: '600',
          marginBottom: theme.spacing.sm,
          color: theme.colors.text,
        },
        summaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.xs,
        },
        summaryLabel: {
          fontSize: theme.typography.sizes.xs,
          color: theme.colors.textMuted,
        },
        summaryValue: {
          fontSize: theme.typography.sizes.xs,
          fontWeight: '500',
          color: theme.colors.text,
        },
        resetButton: {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          alignItems: 'center',
        },
        resetButtonDisabled: { opacity: 0.6 },
        resetButtonText: {
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.textMuted,
        },
      }),
    [theme],
  );

  const parsedTotal = Number(totalBudget) || 0;
  const categoriesTotal = Object.values(categoryBudgets).reduce((sum: number, c: string) => {
    const v = Number(c) || 0;
    return sum + v;
  }, 0);

  const remain = parsedTotal - categoriesTotal;

  // 전체 대비 카테고리 합계 비율 (초과해도 100 이상으로 표현)
  const usageRatio = parsedTotal > 0 ? (categoriesTotal / parsedTotal) * 100 : 0;

  // 초과일 때만, "얼마나 초과했는지" 비율
  const overAmount = categoriesTotal > parsedTotal ? categoriesTotal - parsedTotal : 0;
  const overRatio = parsedTotal > 0 && overAmount > 0 ? (overAmount / parsedTotal) * 100 : 0;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 6, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 2, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 30, useNativeDriver: true }),
    ]).start();
  };

  const loadBudgets = async () => {
    setLoading(true);
    try {
      let rows = await getBudgetsOfMonth(year, month);
      const hasData = rows.length > 0;

      // 해당 월에 저장된 값이 없으면 이전 달 예산을 기본값으로 사용
      if (!hasData) {
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevRows = await getBudgetsOfMonth(prevYear, prevMonth);
        if (prevRows.length > 0) {
          rows = prevRows;
        }
      }

      // 전체 예산
      const total = rows.find((b) => b.mainCategory === null);
      setTotalBudget(total ? String(total.amount) : '');

      // 카테고리별
      const map: Record<string, string> = {};
      rows
        .filter((b) => b.mainCategory !== null)
        .forEach((b) => {
          if (b.mainCategory) {
            map[b.mainCategory] = String(b.amount);
          }
        });
      setCategoryBudgets(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [year, month]);

  const handleChangeCategoryBudget = (cat: string, value: string) => {
    setCategoryBudgets((prev) => ({
      ...prev,
      [cat]: value.replace(/[^0-9]/g, ''), // 숫자만
    }));
  };

  const handleReset = () => {
    Alert.alert(
      '예산 초기화',
      `${year}년 ${month}월 예산을 모두 0으로 초기화합니다. 저장 버튼을 누르면 적용됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: () => {
            setTotalBudget('');
            setCategoryBudgets({});
            Vibration.vibrate();
            Toast.show({
              type: 'success',
              text1: '예산이 초기화되었어요.',
              text2: '저장 버튼을 눌러 적용하세요.',
              onPress: () => Toast.hide(),
            });
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    // 1) 합계/검증
    const parsedTotal = Number(totalBudget) || 0;
    const categoriesTotal = Object.values(categoryBudgets).reduce(
      (sum: number, c: string) => sum + (Number(c) || 0),
      0,
    );

    if (parsedTotal > 0 && categoriesTotal > parsedTotal) {
      Toast.show({
        type: 'error',
        text1: '예산 설정 실패',
        text2: '카테고리 예산이 전체 예산을 초과했어요.',
        onPress: () => Toast.hide(),
      });
      shake();
      Vibration.vibrate();
      return;
    }

    try {
      // 2) 전체 예산 저장 또는 삭제
      const total = parseInt(totalBudget || '0', 10);
      if (!isNaN(total) && total > 0) {
        await upsertBudget(year, month, null, total);
      } else {
        await deleteBudget(year, month, null); // 전체 예산 0이면 DB에서 삭제
      }

      // 3) 카테고리별 예산 저장
      for (const cat of MAIN_CATEGORIES) {
        const raw = categoryBudgets[cat];
        const num = parseInt(raw || '0', 10);
        if (!isNaN(num) && num > 0) {
          await upsertBudget(year, month, cat, num);
        } else {
          await deleteBudget(year, month, cat); // 비었으면 삭제
        }
      }

      // 4) 저장 후 다시 로드
      await loadBudgets();
      Vibration.vibrate();
      // 5) 성공 토스트
      Toast.show({
        type: 'success',
        text1: '예산이 저장되었어요.',
        onPress: () => Toast.hide(),
      });
    } catch (error) {
      console.error('예산 저장 중 오류', error);
      Alert.alert('예산 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <ScreenContainer safeBottom>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        enableOnAndroid={true}
        enableAutomaticScroll={Platform.OS === 'ios'}
        enableResetScrollToCoords={false}
      >
        <Animated.View style={[styles.shakeWrap, { transform: [{ translateX: shakeAnim }] }]}>
          <ScreenHeader title="예산 설정" />
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>
              {year}년 {month}월 예산을 설정하세요.
            </Text>
            <TouchableOpacity
              style={[styles.resetButton, loading && styles.resetButtonDisabled]}
              activeOpacity={0.8}
              onPress={handleReset}
              disabled={loading}
            >
              <Text style={styles.resetButtonText}>예산 초기화</Text>
            </TouchableOpacity>
          </View>

          {/* 전체 예산 카드 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>이번 달 전체 예산</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={Number(totalBudget) > 0 ? Number(totalBudget).toLocaleString() : ''}
                onChangeText={(text) => setTotalBudget(text.replace(/[^0-9]/g, ''))}
                placeholder="예: 1500000"
              />
              <Text style={styles.inputSuffix}>원</Text>
            </View>
            <Text style={styles.cardHint}>전체 지출 상한선을 정해두면 한 달 관리가 쉬워져요.</Text>
          </View>

          {/* 카테고리별 예산 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>카테고리별 예산</Text>
            {EXPENSE_MAIN_CATEGORIES.map((cat) => (
              <View key={cat} style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>{cat}</Text>
                <View style={styles.categoryInputRow} pointerEvents="box-none">
                  <TextInput
                    style={styles.categoryInput}
                    keyboardType="number-pad"
                    value={
                      Number(categoryBudgets[cat]) > 0
                        ? Number(categoryBudgets[cat]).toLocaleString()
                        : ''
                    }
                    onChangeText={(text) => handleChangeCategoryBudget(cat, text)}
                    placeholder="-"
                  />
                  <Text style={styles.inputSuffix}>원</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>예산 요약</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>전체 예산</Text>
              <Text style={styles.summaryValue}>{formatWon(parsedTotal)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>카테고리 합계</Text>
              <Text style={styles.summaryValue}>
                {formatWon(categoriesTotal)} ({usageRatio.toFixed(0)}%)
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>남은 예산</Text>
              <Text style={[styles.summaryValue, remain < 0 && { color: 'red' }]}>
                {formatWon(remain)}
                {remain < 0 && ` (초과 ${overRatio.toFixed(0)}%)`}
              </Text>
            </View>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        activeOpacity={0.8}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>{'예산 저장하기'}</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

