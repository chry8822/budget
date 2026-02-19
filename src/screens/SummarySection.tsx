/**
 * 요약 보기 섹션 (홈 페이지 하위 컴포넌트)
 * - 이번 달 총 지출, 최근 지출, 카테고리 Top 3
 * - 최근 3일 미니 막대 그래프
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { DailySummaryRow, MonthlySummary, Transaction } from '../db/database';
import { useTheme } from '../theme/ThemeContext';
import { formatWon } from '../utils/format';
import { Ionicons } from '@expo/vector-icons';

type SummarySectionProps = {
  year: number;
  month: number;
  remainingDays: number;
  todayExpense: number;
  totalExpense: number;
  loading: boolean;
  last3: DailySummaryRow[];
  max: number;
  recentRows: Transaction[];
  topCategories: MonthlySummary['byCategory'];
  dailySummary: DailySummaryRow[];
};

export default function SummarySection(props: SummarySectionProps) {
  const {
    year,
    month,
    remainingDays,
    todayExpense,
    totalExpense,
    loading,
    last3,
    max,
    recentRows,
    topCategories,
    dailySummary,
  } = props;

  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          marginBottom: theme.spacing.md,
        },
        monthText: {
          ...theme.typography.title,
        },
        subText: {
          ...theme.typography.subtitle,
        },
        todayText: {
          ...theme.typography.body,
          marginTop: theme.spacing.xs,
          color: theme.colors.text,
        },
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
        },
        cardTitle: {
          ...theme.typography.subtitle,
          fontSize: 20,
          fontWeight: 'bold',
          marginBottom: theme.spacing.sm,
        },
        totalAmount: {
          fontSize: theme.typography.sizes.xxl,
          fontWeight: 'bold',
          color: theme.colors.primary,
        },
        bodyText: {
          ...theme.typography.body,
        },
        categoryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 4,
        },
        categoryName: {
          ...theme.typography.body,
        },
        categoryAmount: {
          ...theme.typography.body,
          fontWeight: 'bold',
        },
        recentRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: theme.spacing.xs,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
        },
        recentLeft: {
          flex: 1,
          paddingRight: theme.spacing.sm,
        },
        recentRight: {
          alignItems: 'flex-end',
        },
        recentCategory: {
          ...theme.typography.body,
          fontWeight: 'bold',
        },
        recentMemo: {
          ...theme.typography.body,
          fontSize: theme.typography.sizes.xs,
          color: theme.colors.textMuted,
          marginTop: 2,
        },
        recentAmount: {
          ...theme.typography.body,
          fontWeight: 'bold',
        },
        recentDate: {
          fontSize: theme.typography.sizes.xs,
          color: theme.colors.textMuted,
          marginTop: 2,
        },
        miniChartContainer: {
          marginTop: theme.spacing.md,
        },
        miniChartTitle: {
          fontSize: theme.typography.sizes.sm,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: theme.spacing.xl,
          paddingBottom: theme.spacing.sm,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
        },
        miniChartBars: {
          height: 40,
          flexDirection: 'row',
          alignItems: 'flex-end',
        },
        miniBarWrapper: {
          flex: 1,
          marginHorizontal: 2,
          justifyContent: 'flex-end',
        },
        miniBar: {
          width: '100%',
          borderRadius: 2,
          backgroundColor: theme.colors.primary,
        },
        miniBarLabel: {
          marginTop: 4,
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.textMuted,
          textAlign: 'center',
        },
        miniBarNotice: {
          ...theme.typography.body,
          fontSize: theme.typography.sizes.xs,
          color: theme.colors.textMuted,
          textAlign: 'right',
          paddingTop: theme.spacing.sm,
        },
        boldText: {
          fontWeight: 'bold',
        },
        primaryText: {
          color: theme.colors.primary,
        },
        miniChartSubtext: {
          fontSize: theme.typography.sizes.xs,
          color: theme.colors.textMuted,
        },
        miniBarDayBold: {
          fontWeight: 'bold',
        },
        miniBarDaySub: {
          fontSize: theme.typography.sizes.xs,
          color: theme.colors.textMuted,
        },
        cardBottomTight: {
          paddingBottom: theme.spacing.xs,
        },
      }),
    [theme],
  );

  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (dailySummary.length > 0) {
      barAnim.setValue(0);
      Animated.timing(barAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }
  }, [dailySummary]);

  return (
    <>
      {/* 상단: 이번 달 기본 정보 */}
      <View style={styles.header}>
        <Text style={styles.monthText}>
          {year}년 {month}월 가계 요약
        </Text>
        <Text style={styles.subText}>
          <Ionicons name="calendar-number-outline" size={16} color={theme.colors.textMuted} /> 이번
          달 남은 일수: <Text style={styles.boldText}>{remainingDays}일</Text>
        </Text>
          <Text style={styles.todayText}>
          <Ionicons name="alert-circle-outline" size={16} color={theme.colors.primary} /> 오늘{' '}
          <Text style={styles.primaryText}>{formatWon(todayExpense)}</Text> 썼어요
        </Text>
      </View>

      {/* 총 지출 박스 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>이번 달 총 지출</Text>
        {loading ? (
          <Text style={styles.bodyText}>계산 중...</Text>
        ) : (
          <Text style={styles.totalAmount}>{formatWon(totalExpense)}</Text>
        )}
        {/* 미니 막대 그래프 */}
        {!loading && last3.length > 0 && (
          <View style={styles.miniChartContainer}>
            <Text style={styles.miniChartTitle}>
              <Text>최근 3일 지출</Text>
              <Text style={styles.miniChartSubtext}>
                {' '}
                ({month}월)
              </Text>
            </Text>

            <View style={styles.miniChartBars}>
              {last3.map((row) => {
                const heightPercent = ((row.expense ?? 0) / max) * 100;
                const day = row.date.split('-')[2];
                const BAR_CONTAINER_HEIGHT = 40;
                const targetHeight = (heightPercent / 100) * BAR_CONTAINER_HEIGHT;
                const animatedHeight = barAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, targetHeight],
                });

                return (
                  <View key={row.date} style={styles.miniBarWrapper}>
                    <Animated.View style={[styles.miniBar, { height: animatedHeight }]} />
                    <Text style={styles.miniBarLabel}>
                      <Text style={styles.miniBarDayBold}>{day}일</Text>
                      <Text style={styles.miniBarDaySub}>
                        ({formatWon(row.expense ?? 0)})
                      </Text>
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.miniBarNotice}>*막대가 높을수록 많이 쓴 날이에요</Text>
          </View>
        )}
      </View>

      <View style={[styles.card, styles.cardBottomTight]}>
        <Text style={styles.cardTitle}>최근 지출</Text>

        {loading ? (
          <Text style={styles.bodyText}>불러오는 중...</Text>
        ) : recentRows.length === 0 ? (
          <Text style={styles.bodyText}>아직 등록된 지출이 없습니다.</Text>
        ) : (
          recentRows.map((row) => (
            <View key={row.id} style={styles.recentRow}>
              <View style={styles.recentLeft}>
                <Text style={styles.recentCategory}>{row.mainCategory}</Text>
                {row.memo ? (
                  <Text style={styles.recentMemo} numberOfLines={1}>
                    {row.memo}
                  </Text>
                ) : null}
              </View>
              <View style={styles.recentRight}>
                <Text style={styles.recentAmount}>{formatWon(row.amount)}</Text>
                <Text style={styles.recentDate}>{row.date}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 카테고리 Top 3 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>지출이 많은 카테고리 Top 3</Text>
        {loading ? (
          <Text style={styles.bodyText}>계산 중...</Text>
        ) : topCategories.length === 0 ? (
          <Text style={styles.bodyText}>아직 이번 달 지출이 없습니다.</Text>
        ) : (
          topCategories.map((cat) => (
            <View key={cat.mainCategory} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{cat.mainCategory}</Text>
              <Text style={styles.categoryAmount}>{formatWon(cat.amount)}</Text>
            </View>
          ))
        )}
      </View>
    </>
  );
}
