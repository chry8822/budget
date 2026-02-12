// src/screens/SummaryScreen.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import ScreenContainer from '../components/common/ScreenContainer';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import {
  getMonthlySummary,
  getCategorySummary,
  getPaymentSummary,
  CategorySummaryRow,
  PaymentSummaryRow,
  MonthlySummary,
  getTotalBudgetOfMonth,
  getMonthlyIncomeTotal,
} from '../db/database';
import { useTransactionChange } from '../components/common/TransactionChangeContext';
import { formatAmount, formatWon } from '../utils/format';
import ScrollHint from '../components/common/ScrollHint';
import { useScrollability } from '../hooks/useScrollability';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import HapticWrapper from '../components/common/HapticWrapper';
import MonthPickerBottomSheet from '../components/summary/MonthPickerBottomSheet';

function getPrevYearMonth(y: number, m: number) {
  if (m === 1) return { year: y - 1, month: 12 };
  return { year: y, month: m - 1 };
}

// 다음 달 (12 → 1년 증가)
function getNextYearMonth(y: number, m: number) {
  if (m === 12) return { year: y + 1, month: 1 };
  return { year: y, month: m + 1 };
}

function formatYearMonthLabel(y: number, m: number) {
  return `${y}년 ${m}월`;
}

export default function SummaryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { changeTick } = useTransactionChange();

  const now = new Date();
  const today = now.getDate();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // const [loading, setLoading] = useState(false);

  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [topCategories, setTopCategories] = useState<CategorySummaryRow[]>([]);
  const [topPayment, setTopPayment] = useState<PaymentSummaryRow[]>([]);
  const [totalBudget, setTotalBudget] = useState<number | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  const [prevMonthlySummary, setPrevMonthlySummary] = useState<MonthlySummary | null>(null);
  const [prevTopCategory, setPrevTopCategory] = useState<CategorySummaryRow | null>(null);
  const [prevTopPayment, setPrevTopPayment] = useState<PaymentSummaryRow | null>(null);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);

  const { isScrollable, onContentSizeChange, onLayout, scrollHintOpacity, onScroll } =
    useScrollability(8);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const daysInMonth = getDaysInMonth(year, month);

  const loadSummary = async (targetYear: number, targetMonth: number) => {
    // setLoading(true);
    try {
      const currentMonthly = await getMonthlySummary(targetYear, targetMonth);
      const currentCats = await getCategorySummary(targetYear, targetMonth);
      const currentPays = await getPaymentSummary(targetYear, targetMonth);
      const budgetAmount = await getTotalBudgetOfMonth(targetYear, targetMonth);
      const incomeTotal = await getMonthlyIncomeTotal(targetYear, targetMonth);

      const { year: py, month: pm } = getPrevYearMonth(targetYear, targetMonth);
      const prevMonthly = await getMonthlySummary(py, pm);
      const prevCats = await getCategorySummary(py, pm);
      const prevPays = await getPaymentSummary(py, pm);

      setMonthlyIncome(incomeTotal);
      setTotalBudget(budgetAmount);
      setMonthlySummary(currentMonthly);
      setTopCategories(currentCats.slice(0, 3));
      setTopPayment(prevPays.slice(0, 3)); // ← 결제수단은 지금은 안 쓸 거면 나중에 제거

      setPrevMonthlySummary(prevMonthly);
      setPrevTopCategory(prevCats[0] ?? null);
      setPrevTopPayment(prevPays[0] ?? null);
    } finally {
      // setLoading(false);
    }
  };

  // 초기 로드 + 거래 변경 시 다시 로드
  useEffect(() => {
    loadSummary(year, month);
  }, [year, month, changeTick]);

  const handlePrevMonth = () => {
    const { year: ny, month: nm } = getPrevYearMonth(year, month);
    setYear(ny);
    setMonth(nm);
  };

  const handleNextMonth = () => {
    const { year: ny, month: nm } = getNextYearMonth(year, month);
    setYear(ny);
    setMonth(nm);
  };

  const renderExpenseDiff = (current: number, prev: number) => {
    if (prev === 0) {
      if (current === 0) return '지난 달과 이번 달 모두 지출이 없어요.';
      return '지난 달에는 지출이 없었고, 이번 달에 새로 지출이 생겼어요.';
    }
    const diff = current - prev;
    const rate = (diff / prev) * 100;

    if (diff > 0) {
      return `지난 달보다 ${formatWon(diff)} (${rate.toFixed(1)}%) 더 썼어요.`;
    }
    if (diff < 0) {
      return `지난 달보다 ${formatWon(Math.abs(diff))} (${Math.abs(rate).toFixed(1)}%) 덜 썼어요.`;
    }
    return '지난 달과 이번 달 총 지출이 똑같아요.';
  };

  const monthLabel = formatYearMonthLabel(year, month);

  return (
    <>
      <ScreenContainer>
        <ScrollView
          onLayout={onLayout}
          onContentSizeChange={onContentSizeChange}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* 1. 월 헤더 */}
          <View style={styles.headerRow}>
            {/* 좌측: 월 네비게이션 */}
            <View style={styles.monthNav}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.monthLabelWrapper}
                onPress={() => {
                  setMonthPickerVisible(true);
                }}
              >
                <Text style={styles.monthLabel}>{monthLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextMonth}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* 우측: 예산 설정 버튼 */}
            <HapticWrapper onPress={() => navigation.navigate('BudgetSetting')}>
              <View>
                <Text style={styles.budgetLink}>예산 설정</Text>
              </View>
            </HapticWrapper>
          </View>

          <Text style={styles.subtitle}>이번 달 전체 흐름과 예산 사용을 확인해 보세요.</Text>

          {/* {loading ? (
            <ActivityIndicator />
          ) : (
            <> */}
          {/* 2-A. 수입 / 지출 / 잔액 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>이번 달 수입 / 지출</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>수입</Text>
              <Text style={[styles.rowValue, styles.incomeText]}>{formatWon(monthlyIncome)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>지출</Text>
              <Text style={[styles.rowValue, styles.expenseText]}>
                {formatWon(monthlySummary?.totalExpense ?? 0)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>잔액</Text>
              <Text style={styles.rowValue}>
                {formatWon(monthlyIncome - (monthlySummary?.totalExpense ?? 0))}
              </Text>
            </View>
          </View>

          {/* 2-B. 예산 vs 지출 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>예산 사용 현황</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>이번 달 예산</Text>
              <Text style={styles.rowValue}>{formatWon(totalBudget ?? 0)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>지출</Text>
              <Text style={styles.rowValue}>{formatWon(monthlySummary?.totalExpense ?? 0)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>남은 예산</Text>
              <Text style={styles.rowValue}>
                {formatWon((totalBudget ?? 0) - (monthlySummary?.totalExpense ?? 0))}
              </Text>
            </View>
            {totalBudget != null && (monthlySummary?.totalExpense ?? 0) > totalBudget && (
              <Text style={[styles.cardSubtitle, styles.warnText]}>
                예산을 {formatWon((monthlySummary?.totalExpense ?? 0) - (totalBudget ?? 0))}{' '}
                초과했어요.
              </Text>
            )}
          </View>

          {/* 3-A. 총 지출 + 일 평균 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>총 지출</Text>
            <Text style={styles.cardAmount}>{formatWon(monthlySummary?.totalExpense ?? 0)}</Text>
            <Text style={styles.cardSubtitle}>
              하루 평균{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {daysInMonth > 0
                  ? formatWon(
                      Math.round(
                        (monthlySummary?.totalExpense ?? 0) /
                          (month === now.getMonth() + 1 && year === now.getFullYear()
                            ? today
                            : daysInMonth),
                      ),
                    )
                  : '0원'}
              </Text>{' '}
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  color: theme.colors.textMuted,
                }}
              >
                ({month}/
                {month === now.getMonth() + 1 && year === now.getFullYear() ? today : daysInMonth}{' '}
                기준)
              </Text>
            </Text>
          </View>

          {/* 3-B. 카테고리 TOP 3 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>카테고리 TOP 3</Text>
            {topCategories.length === 0 ? (
              <Text style={styles.emptyText}>내역이 없습니다.</Text>
            ) : (
              topCategories.map((row) => (
                <View key={row.mainCategory} style={styles.row}>
                  <Text style={styles.rowLabel}>{row.mainCategory}</Text>
                  <Text style={styles.rowValue}>{formatWon(row.amount)}</Text>
                </View>
              ))
            )}
          </View>

          {/* 4. 지난 달과 비교 (결제수단 비교는 원하면 유지/삭제 선택) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>지난 달과 비교</Text>

            <View style={styles.compareRow}>
              <Text style={[styles.compareCellLabel, styles.compareHeaderText]}>항목</Text>
              <Text style={[styles.compareCellValue, styles.compareHeaderText]}>이번 달</Text>
              <Text style={[styles.compareCellValue, styles.compareHeaderText]}>지난 달</Text>
            </View>

            <View style={styles.compareRow}>
              <Text style={styles.compareCellLabel}>총 지출</Text>
              <Text style={styles.compareCellValue}>
                {formatAmount(monthlySummary?.totalExpense ?? 0)}
              </Text>
              <Text style={styles.compareCellValue}>
                {formatAmount(prevMonthlySummary?.totalExpense ?? 0)}
              </Text>
            </View>

            <View style={styles.compareRow}>
              <Text style={styles.compareCellLabel}>가장 큰 카테고리</Text>

              <View style={styles.compareCellValueColumn}>
                <Text style={styles.compareCellValueText}>
                  {formatAmount(topCategories[0]?.amount ?? 0)}
                </Text>
                <Text style={styles.compareSubText}>({topCategories[0]?.mainCategory ?? '-'})</Text>
              </View>
              <View style={styles.compareCellValueColumn}>
                <Text style={styles.compareCellValueText}>
                  {formatAmount(prevTopCategory?.amount ?? 0)}
                </Text>
                <Text style={styles.compareSubText}>({prevTopCategory?.mainCategory ?? '-'})</Text>
              </View>
            </View>

            {/* 결제수단 TOP 1 비교는 필요 없으면 통째로 삭제 가능 */}
            {/* ... (원래 코드 유지/삭제) ... */}

            {prevMonthlySummary && (
              <Text style={[styles.diffText, { marginTop: theme.spacing.sm }]}>
                {renderExpenseDiff(
                  monthlySummary?.totalExpense ?? 0,
                  prevMonthlySummary.totalExpense,
                )}
              </Text>
            )}
          </View>
          {/* </> */}
          {/* )} */}
        </ScrollView>
        <ScrollHint visible={isScrollable} opacity={scrollHintOpacity} top={40} />
      </ScreenContainer>
      <MonthPickerBottomSheet
        visible={monthPickerVisible}
        onClose={() => setMonthPickerVisible(false)}
        initialYear={year}
        initialMonth={month}
        onConfirm={(nextYear, nextMonth) => {
          setYear(nextYear);
          setMonth(nextMonth);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // 기존 스타일 그대로 + 월 네비용 스타일 조금만 추가
  title: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthLabelWrapper: {
    marginHorizontal: theme.spacing.sm,
  },
  monthLabel: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  budgetLink: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  // 아래는 네 기존 스타일 그대로
  card: {
    padding: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontWeight: 'bold',
  },
  cardAmount: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  cardSubtitle: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
  },
  emptyText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  rowLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  rowValue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
  },
  compareCellLabel: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  compareCellValue: {
    flex: 0.5,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    textAlign: 'right',
    marginLeft: theme.spacing.sm,
    fontWeight: 'bold',
  },
  compareCellValueColumn: {
    flex: 0.5,
    marginLeft: theme.spacing.sm,
    alignItems: 'flex-end',
  },
  compareCellValueText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  compareSubText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  compareHeaderText: {
    fontWeight: 'bold',
  },
  diffText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
  incomeText: {
    color: theme.colors.income ?? '#2e7d32',
  },
  expenseText: {
    color: theme.colors.primary,
  },
  warnText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});
