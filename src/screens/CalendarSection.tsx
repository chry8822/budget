/**
 * 캘린더 섹션 (홈 페이지 하위 컴포넌트)
 * - 월간 달력 + 일별 수입/지출 표시
 * - 날짜 선택 시 바텀시트로 해당 날짜 내역 + 추가 버튼
 */
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { useColorScheme, useTheme } from '../theme/ThemeContext';
import {
  DailySummaryRow,
  Transaction,
  getTransactionsByDate,
  getMonthlySummary,
  getDailySummaryOfMonth,
} from '../db/database';
import { formatWon } from '../utils/format';
import { DayProps } from 'react-native-calendars/src/calendar/day';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import DayDetailBottomSheet from '../components/calendar/DayDetailBottomSheet';
import MonthPickerBottomSheet from '../components/summary/MonthPickerBottomSheet';

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

const SELECTION_FADE_DURATION = 220;

type CalendarDayCellStyles = ReturnType<typeof createCalendarStyles>;

function CalendarDayCell({
  isSelected,
  isLastRow,
  isDisabled,
  onPress,
  children,
  styles,
}: {
  isSelected: boolean;
  isLastRow: boolean;
  isDisabled: boolean;
  onPress: () => void;
  children: React.ReactNode;
  styles: CalendarDayCellStyles;
}) {
  const selectionOpacity = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(selectionOpacity, {
      toValue: isSelected ? 1 : 0,
      duration: SELECTION_FADE_DURATION,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isSelected, selectionOpacity]);

  return (
    <TouchableOpacity onPress={onPress} style={styles.dayWrapper} activeOpacity={0.7}>
      <View style={[styles.dayContainer, isLastRow && { borderBottomWidth: 0 }]}>
        <Animated.View
          style={[styles.daySelectionOverlay, { opacity: selectionOpacity }]}
          pointerEvents="none"
        />
        <View style={styles.dayContent}>{children}</View>
      </View>
    </TouchableOpacity>
  );
}

function createCalendarStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
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
    calendarCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: theme.spacing.md,
    },
    calendarHeaderContainer: {
      paddingTop: 8,
      paddingBottom: 4,
    },
    calendarHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    calendarHeaderMonthLabel: {
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
    calendarHeaderMonthText: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    weekDayRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    weekDayCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hintBold: {
      fontWeight: 'bold',
    },
    weekDayText: {
      fontSize: theme.typography.sizes.xs,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    dayWrapper: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayContainer: {
      flex: 1,
      alignSelf: 'stretch',
      minHeight: 72,
      minWidth: 44,
      paddingVertical: 4,
      alignItems: 'center',
      justifyContent: 'flex-start',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      position: 'relative',
    },
    daySelectionOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.primarySoft ?? theme.colors.surface,
      borderRadius: 8,
    },
    dayContent: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      minHeight: 44,
      minWidth: 44,
    },
    dayNumber: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text,
    },
    dayNumberDisabled: {
      color: theme.colors.textMuted,
    },
    dayNumberSelected: {
      color: theme.colors.primary,
      fontWeight: 'bold',
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
      fontSize: theme.typography.sizes.sm,
      fontWeight: 'bold',
    },
    monthSummaryIncome: {
      color: theme.colors.income,
    },
    monthSummaryExpense: {
      color: theme.colors.primary,
    },
    dayExpense: {
      marginTop: 3,
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.primary,
    },
    dayIncome: {
      marginTop: 1,
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.income,
    },
  });
}

type Props = {
  year: number;
  month: number;
  dailySummary: DailySummaryRow[];
  totalIncome: number;
  totalExpense: number;
  navigation: NativeStackNavigationProp<RootStackParamList>;
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
  navigation,
}: Props) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const styles = useMemo(() => createCalendarStyles(theme), [theme]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Transaction[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [displayYear, setDisplayYear] = useState(year);
  const [displayMonth, setDisplayMonth] = useState(month);
  const [displayTotalIncome, setDisplayTotalIncome] = useState(totalIncome);
  const [displayTotalExpense, setDisplayTotalExpense] = useState(totalExpense);
  const [displayDailySummary, setDisplayDailySummary] = useState<DailySummaryRow[]>(dailySummary);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);

  useEffect(() => {
    setDisplayYear(year);
    setDisplayMonth(month);
    setDisplayTotalIncome(totalIncome);
    setDisplayTotalExpense(totalExpense);
    setDisplayDailySummary(dailySummary);
  }, [year, month, totalIncome, totalExpense, dailySummary]);

  const loadDisplayMonth = async (y: number, m: number) => {
    try {
      const [monthly, daily] = await Promise.all([
        getMonthlySummary(y, m),
        getDailySummaryOfMonth(y, m),
      ]);
      setDisplayTotalIncome(monthly.totalIncome);
      setDisplayTotalExpense(monthly.totalExpense);
      setDisplayDailySummary(daily);
    } catch (e) {
      console.error('캘린더 월별 데이터 로드 실패', e);
    }
  };

  // 1) 달력에 뿌릴 markedDates (날짜별 합계 반영)
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    displayDailySummary.forEach((row) => {
      marks[row.date] = {
        marked: true,
        dotColor: theme.colors.primary,
        customStyles: {
          container: {
            backgroundColor: theme.colors.background,
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
            color: theme.colors.onPrimary,
            fontWeight: 'bold',
          },
        },
      };
    }

    return marks;
  }, [displayDailySummary, selectedDate, theme]);

  // 2) 선택 날짜 변경 시 상세 내역 로드
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
    displayDailySummary.forEach((row) => {
      map[row.date] = row;
    });
    return map;
  }, [displayDailySummary]);

  function formatCellAmount(amount: number) {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) {
      const man = amount / 10_000;
      if (Math.abs(man) >= 10) return `${Math.round(man)}만`;
      return `${man.toFixed(1)}만`;
    }
    return amount.toLocaleString();
  }

  const initialMonth = `${displayYear}-${String(displayMonth).padStart(2, '0')}-01`;

  const goToPrevMonth = () => {
    const prevMonth = displayMonth === 1 ? 12 : displayMonth - 1;
    const prevYear = displayMonth === 1 ? displayYear - 1 : displayYear;
    setDisplayYear(prevYear);
    setDisplayMonth(prevMonth);
    loadDisplayMonth(prevYear, prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = displayMonth === 12 ? 1 : displayMonth + 1;
    const nextYear = displayMonth === 12 ? displayYear + 1 : displayYear;
    setDisplayYear(nextYear);
    setDisplayMonth(nextMonth);
    loadDisplayMonth(nextYear, nextMonth);
  };

  const weekDayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.subText}>
          <Text style={styles.hintBold}>날짜를 누르면</Text> 그날의 지출 내역을 볼 수 있어요.
        </Text>
      </View>

      <View style={styles.monthSummaryRow}>
        <Text style={styles.monthSummaryLabel}>수입</Text>
        <Text style={[styles.monthSummaryValue, styles.monthSummaryIncome]}>
          {formatWon(displayTotalIncome)}
        </Text>

        <Text style={styles.monthSummaryLabel}>지출</Text>
        <Text style={[styles.monthSummaryValue, styles.monthSummaryExpense]}>
          {formatWon(displayTotalExpense)}
        </Text>
      </View>

      {/* ✅ 진짜 달력 */}

      <View style={styles.calendarCard} pointerEvents="box-none">
        <Calendar
          key={`calendar-${colorScheme}`}
          hideExtraDays
          enableSwipeMonths
          initialDate={initialMonth}
          monthFormat={'yyyy년 M월'}
          onMonthChange={(date: DayData) => {
            const y = date.year ?? displayYear;
            const m = date.month ?? displayMonth;
            setDisplayYear(y);
            setDisplayMonth(m);
            loadDisplayMonth(y, m);
          }}
          onDayPress={(day: DayData) => setSelectedDate(day.dateString)}
          markingType="custom"
          markedDates={markedDates}
          customHeader={() => (
            <View style={styles.calendarHeaderContainer}>
              <View style={styles.calendarHeaderRow}>
                <TouchableOpacity
                  onPress={goToPrevMonth}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calendarHeaderMonthLabel}
                  onPress={() => setMonthPickerVisible(true)}
                >
                  <Text style={styles.calendarHeaderMonthText}>
                    {displayYear}년 {displayMonth}월
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={goToNextMonth}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.weekDayRow}>
                {weekDayNames.map((day) => (
                  <View key={day} style={styles.weekDayCell}>
                    <Text style={styles.weekDayText}>{day}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          theme={{
            calendarBackground: theme.colors.surface,
            textSectionTitleColor: theme.colors.textMuted,
            todayTextColor: theme.colors.primary,
            dayTextColor: theme.colors.text,
            textDisabledColor: theme.colors.textMuted,
            arrowColor: theme.colors.textMuted,
            monthTextColor: theme.colors.text,
            textMonthFontSize: 18,
            textMonthFontWeight: 'bold',
            textDayHeaderFontSize: 13,
            textDayHeaderFontWeight: '600',
          }}
          dayComponent={(props: DayProps & { date?: DateData }) => {
            const { date, state, onPress } = props;
            if (!date) return null;
            const firstDayOfWeek = new Date(displayYear, displayMonth - 1, 1).getDay();
            const lastDate = new Date(displayYear, displayMonth, 0).getDate();
            const thisRow = Math.floor((firstDayOfWeek + (date?.day ?? 1) - 1) / 7);
            const lastRow = Math.floor((firstDayOfWeek + lastDate - 1) / 7);
            const isLastRow = thisRow === lastRow;

            const key = date.dateString; // 'YYYY-MM-DD'
            const row = summaryMap[key]; // DailySummaryRow or undefined

            const isDisabled = state === 'disabled';
            const isSelected = selectedDate === key;

            const exp = row?.expense ?? 0;
            const inc = row?.income ?? 0;

            const handleDayPress = () => {
              if (isDisabled) return;
              setSelectedDate(key);
              onPress?.(date);
            };

            return (
              <CalendarDayCell
                isSelected={isSelected}
                isLastRow={isLastRow}
                isDisabled={isDisabled}
                onPress={handleDayPress}
                styles={styles}
              >
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
              </CalendarDayCell>
            );
          }}
        />
      </View>

      <DayDetailBottomSheet
        visible={!!selectedDate}
        selectedDate={selectedDate}
        transactions={selectedTransactions}
        loading={loadingDetail}
        onClose={() => setSelectedDate(null)}
        onAddExpense={() => {
          if (!selectedDate) return;
          navigation.navigate('AddTransaction', { mode: 'expense', initialDate: selectedDate });
          setSelectedDate(null);
        }}
        onAddIncome={() => {
          if (!selectedDate) return;
          navigation.navigate('AddTransaction', { mode: 'income', initialDate: selectedDate });
          setSelectedDate(null);
        }}
        onTransactionPress={(id) => {
          setSelectedDate(null);
          navigation.navigate('EditTransaction', { id });
        }}
      />

      <MonthPickerBottomSheet
        visible={monthPickerVisible}
        onClose={() => setMonthPickerVisible(false)}
        initialYear={displayYear}
        initialMonth={displayMonth}
        onConfirm={(y, m) => {
          setDisplayYear(y);
          setDisplayMonth(m);
          loadDisplayMonth(y, m);
          setMonthPickerVisible(false);
        }}
      />
    </>
  );
}
