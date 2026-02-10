/**
 * 캘린더 섹션 (홈 페이지 하위 컴포넌트)
 * - 월간 달력 + 일별 수입/지출 표시
 * - 날짜 선택 시 상세 거래 내역 조회
 */
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import theme from '../theme';
import { DailySummaryRow, Transaction, getTransactionsByDate } from '../db/database';
import { formatWon } from '../utils/format';
import { DayProps } from 'react-native-calendars/src/calendar/day';

LocaleConfig.locales['ko'] = {
  monthNames: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  monthNamesShort: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

type Props = {
  year: number;
  month: number;
  dailySummary: DailySummaryRow[];
  totalIncome: number;
  totalExpense: number;
};

type DayData = {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
};

export default function CalendarSection({
  year,
  month,
  dailySummary,
  totalIncome,
  totalExpense,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Transaction[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 1) 달력에 뿌릴 markedDates (날짜별 합계 반영)
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    dailySummary.forEach((row) => {
      marks[row.date] = {
        marked: true,
        dotColor: theme.colors.primary,
        customStyles: {
          container: {
            backgroundColor: 'white',
          },
          text: {
            color: theme.colors.text,
          },
        },
      };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: theme.colors.primary,
        customStyles: {
          container: {
            backgroundColor: theme.colors.primary,
            borderRadius: 8,
          },
          text: {
            color: theme.colors.background,
            fontWeight: 'bold',
          },
        },
      };
    }

    return marks;
  }, [dailySummary, selectedDate]);

  // 2) 초기 선택 날짜: 이번 달 dailySummary 중 마지막 날짜
  useEffect(() => {
    if (dailySummary.length > 0 && !selectedDate) {
      const last = dailySummary[dailySummary.length - 1];
      setSelectedDate(last.date);
    }
  }, [dailySummary, selectedDate]);

  // 3) 선택 날짜 변경 시 상세 내역 로드
  useEffect(() => {
    if (!selectedDate) {
      setSelectedTransactions([]);
      return;
    }

    const load = async () => {
      try {
        setLoadingDetail(true);
        const rows = await getTransactionsByDate(selectedDate);
        setSelectedTransactions(rows);
      } finally {
        setLoadingDetail(false);
      }
    };

    load();
  }, [selectedDate]);

  const summaryMap = useMemo(() => {
    const map: Record<string, DailySummaryRow> = {};
    dailySummary.forEach((row) => {
      map[row.date] = row;
    });
    return map;
  }, [dailySummary]);

  function formatCellAmount(amount: number) {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) {
      const man = amount / 10_000;
      if (Math.abs(man) >= 10) return `${Math.round(man)}만`;
      return `${man.toFixed(1)}만`;
    }
    return amount.toLocaleString();
  }

  const initialMonth = `${year}-${String(month).padStart(2, '0')}-01`;

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.subText}>
          <Text style={{ fontWeight: 'bold' }}>날짜를 누르면</Text> 그날의 지출 내역을 볼 수 있어요.
        </Text>
      </View>

      <View style={styles.monthSummaryRow}>
        <Text style={styles.monthSummaryLabel}>수입</Text>
        <Text style={[styles.monthSummaryValue, { color: '#1e88e5' }]}>
          {formatWon(totalIncome)}
        </Text>

        <Text style={styles.monthSummaryLabel}>지출</Text>
        <Text style={[styles.monthSummaryValue, { color: '#e53935' }]}>
          {formatWon(totalExpense)}
        </Text>
      </View>

      {/* ✅ 진짜 달력 */}

      <View style={styles.calendarCard}>
        <Calendar
          initialDate={initialMonth}
          monthFormat={'yyyy년 M월'}
          onDayPress={(day: DayData) => setSelectedDate(day.dateString)}
          markingType="custom"
          markedDates={markedDates}
          theme={{
            calendarBackground: theme.colors.surface,
            textSectionTitleColor: theme.colors.textMuted,
            todayTextColor: theme.colors.primary,
            dayTextColor: theme.colors.text,
            textDisabledColor: theme.colors.textMuted,
            arrowColor: theme.colors.text,
            monthTextColor: theme.colors.text,
            textMonthFontSize: 18,
            textMonthFontWeight: 'bold',
            textDayHeaderFontSize: 13,
            textDayHeaderFontWeight: '600',
          }}
          dayComponent={(props: DayProps & { date?: DateData }) => {
            const { date, state } = props;
            if (!date) return null;

            const key = date.dateString; // 'YYYY-MM-DD'
            const row = summaryMap[key]; // DailySummaryRow or undefined

            const isDisabled = state === 'disabled';
            const isSelected = selectedDate === key;

            const exp = row?.expense ?? 0;
            const inc = row?.income ?? 0;

            return (
              <Pressable onPress={() => setSelectedDate(key)}>
                <View style={[styles.dayContainer, isSelected && styles.dayContainerSelected]}>
                  <Text
                    style={[
                      styles.dayNumber,
                      isDisabled && styles.dayNumberDisabled,
                      isSelected && styles.dayNumberSelected,
                    ]}
                  >
                    {date.day}
                  </Text>
                  {exp !== 0 && <Text style={styles.dayExpense}>{formatCellAmount(exp)}</Text>}
                  {inc !== 0 && <Text style={styles.dayIncome}>{formatCellAmount(inc)}</Text>}
                </View>
              </Pressable>
            );
          }}
        />
      </View>

      {/* 선택된 날짜 요약 + 상세 */}
      {selectedDate && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{selectedDate} 지출 내역</Text>

          {loadingDetail ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : selectedTransactions.length === 0 ? (
            <Text style={styles.bodyText}>이 날에는 지출이 없어요.</Text>
          ) : (
            selectedTransactions.map((tx) => (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txLeft}>
                  <Text style={styles.txCategory}>{tx.mainCategory}</Text>
                  {tx.memo ? (
                    <Text style={styles.txMemo} numberOfLines={1}>
                      {tx.memo}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txAmount}>{formatWon(tx.amount)}</Text>
                  {tx.createdAt ? (
                    <Text style={styles.txTime}>{tx.createdAt.slice(11, 16)}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.md,
  },
  monthText: {
    ...theme.typography.title,
  },
  subText: {
    ...theme.typography.subtitle,
    textAlign: 'center',
    fontSize: theme.typography.sizes.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  calendarCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.subtitle,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  bodyText: {
    ...theme.typography.body,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
  },
  txLeft: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txCategory: {
    ...theme.typography.body,
    fontWeight: 'bold',
  },
  txMemo: {
    ...theme.typography.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    ...theme.typography.body,
    fontWeight: 'bold',
  },
  txTime: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  dayContainer: {
    width: Dimensions.get('window').width / 8,
    height: 72,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  dayContainerSelected: {
    backgroundColor: theme.colors.primarySoft ?? '#EEF3FF',
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 16,
    color: theme.colors.text,
  },
  dayNumberDisabled: {
    color: theme.colors.textMuted,
  },
  dayNumberSelected: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  dayExpense: {
    marginTop: 3,
    fontSize: 12,
    color: '#e53935',
  },
  dayIncome: {
    marginTop: 1,
    fontSize: 12,
    color: '#1e88e5',
  },
  monthSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  monthSummaryLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textMuted,
    fontWeight: 'bold',
  },
  monthSummaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
