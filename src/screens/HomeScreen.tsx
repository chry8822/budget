/**
 * 홈 페이지 (메인)
 * - 캘린더 / 요약 보기 탭 전환
 * - 지출·수입 추가 버튼
 */
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated } from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ScreenContainer from '../components/common/ScreenContainer';
import theme from '../theme';
import {
  getMonthlySummary,
  MonthlySummary,
  getRecentTransactionsOfMonth,
  Transaction,
  getTodayExpenseTotal,
  DailySummaryRow,
  getDailySummaryOfMonth,
} from '../db/database';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import ScrollHint from '../components/common/ScrollHint';
import { RootStackParamList } from '../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AnimatedButton from '../components/common/AnimatedButton';
import { useScrollability } from '../hooks/useScrollability';
import ExpandableFab, { FabAction } from '../components/common/ExpandableFab';
import SummarySection from './SummarySection';
import CalendarSection from './CalendarSection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingModal, { ONBOARDING_KEY } from '../components/common/OnboardingModal';

type Props = NativeStackScreenProps<RootStackParamList>;
type HomeTab = 'calendar' | 'summary';

export default function HomeScreen({ navigation }: Props) {
  const {
    isScrollable,
    onContentSizeChange,
    onLayout,
    scrollHintOpacity,
    fabOpacity,
    fabTranslateX,
    onScroll,
  } = useScrollability(8);

  const fabActions: FabAction[] = useMemo(
    () => [
      {
        label: '수입',
        icon: 'trending-up-outline',
        color: theme.colors.income,
        onPress: () => navigation.navigate('AddTransaction', { mode: 'income' }),
      },
      {
        label: '지출',
        icon: 'trending-down-outline',
        color: theme.colors.primary,
        onPress: () => navigation.navigate('AddTransaction', { mode: 'expense' }),
      },
      {
        label: `예산\n설정`,
        icon: 'settings-outline',
        color: theme.colors.secondary,
        onPress: () => navigation.navigate('BudgetSetting'),
      },
    ],
    [navigation],
  );

  const [{ year, month, remainingDays, todayStr }] = useState(getThisMonthInfo);
  const [todayExpense, setTodayExpense] = useState(0);
  const [homeTab, setHomeTab] = useState<HomeTab>('calendar');

  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentRows, setRecentRows] = useState<Transaction[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummaryRow[]>([]);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const topCategories = summary?.byCategory.slice(0, 3) ?? [];

  const last3 = dailySummary.slice(-3);
  const max = Math.max(...last3.map((r) => r.expense ?? 0), 1);

  useEffect(() => {
    startBreathingAnimation();
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const hasShown = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (!hasShown) {
      setShowOnboarding(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [year, month]),
  );

  const startBreathingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getMonthlySummary(year, month);
      const recents = await getRecentTransactionsOfMonth(year, month, 5);
      const todayTotal = await getTodayExpenseTotal(todayStr);
      const dailyRows = await getDailySummaryOfMonth(year, month);

      setSummary(data);
      setRecentRows(recents);
      setTodayExpense(todayTotal);
      setDailySummary(dailyRows);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSummary();
    setRefreshing(false);
  };

  function getThisMonthInfo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const today = now.getDate();

    const monthStr = month.toString().padStart(2, '0');
    const dayStr = today.toString().padStart(2, '0');
    const todayStr = `${year}-${monthStr}-${dayStr}`;

    const lastDay = new Date(year, month, 0);
    const totalDays = lastDay.getDate();
    const remainingDays = totalDays - today + 1;

    return { year, month, remainingDays, todayStr };
  }

  return (
    <ScreenContainer>
      <ScrollView
        ref={scrollViewRef}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Animated.Text style={[styles.refreshHint, { transform: [{ scale: scaleAnim }] }]}>
          화면을 아래로 당기면 새로고침 됩니다
        </Animated.Text>

        <View style={styles.homeTabBar}>
          <AnimatedButton
            onPress={() => setHomeTab('calendar')}
            style={[styles.homeTab, homeTab === 'calendar' && styles.homeTabActive]}
          >
            <Text style={[styles.homeTabText, homeTab === 'calendar' && styles.homeTabTextActive]}>
              캘린더
            </Text>
          </AnimatedButton>

          <AnimatedButton
            onPress={() => setHomeTab('summary')}
            style={[styles.homeTab, homeTab === 'summary' && styles.homeTabActive]}
          >
            <Text style={[styles.homeTabText, homeTab === 'summary' && styles.homeTabTextActive]}>
              요약 보기
            </Text>
          </AnimatedButton>
        </View>

        {homeTab === 'calendar' ? (
          <CalendarSection
            year={year}
            month={month}
            dailySummary={dailySummary}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
          />
        ) : (
          <SummarySection
            year={year}
            month={month}
            remainingDays={remainingDays}
            todayExpense={todayExpense}
            totalExpense={totalExpense}
            loading={loading}
            last3={last3}
            max={max}
            recentRows={recentRows}
            topCategories={topCategories}
            dailySummary={dailySummary}
          />
        )}
      </ScrollView>

      <ExpandableFab actions={fabActions} fabOpacity={fabOpacity} fabTranslateX={fabTranslateX} />

      <ScrollHint scrollRef={scrollViewRef} visible={isScrollable} opacity={scrollHintOpacity} />

      <OnboardingModal
        visible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onSlideAction={(index) => {
          switch (index) {
            case 0: // 바로 등록하기 → 지출 추가
              navigation.navigate('AddTransaction', { mode: 'expense' });
              break;
            case 1: // 캘린더 확인하기 → 캘린더 탭으로 전환
              setHomeTab('calendar');
              break;
            case 2: // 통계 보러가기 → 통계 탭
              navigation.navigate('MainTabs', { screen: 'Stats' } as any);
              break;
            case 3: // 예산 설정하기 → 예산 설정 화면
              navigation.navigate('BudgetSetting');
              break;
          }
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  refreshHint: {
    ...theme.typography.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  homeTabBar: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    padding: 2,
  },
  homeTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeTabActive: {
    backgroundColor: theme.colors.primary,
  },
  homeTabText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
  },
  homeTabTextActive: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
});
