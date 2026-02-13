/**
 * 내역 페이지 (거래 내역 목록)
 * - 월별/전체 거래 목록 조회, 검색, 삭제
 * - 기간 필터 (이번 달, 지난 달, 전체, 커스텀)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import ScreenContainer from '../components/common/ScreenContainer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { getAllTransactions, Transaction, deleteTransactionById } from '../db/database';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import { formatWon } from '../utils/format';
import { Alert, ScrollView } from 'react-native';
import MonthYearPicker from '../components/common/MonthYearPicker';
import { useTransactionChange } from '../components/common/TransactionChangeContext';
import { useScrollability } from '../hooks/useScrollability';
import ScrollHint from '../components/common/ScrollHint';
import ExpandableFab, { FabAction } from '../components/common/ExpandableFab';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type SummaryRange = 'thisMonth' | 'lastMonth' | 'all' | 'custom';

export default function TransactionsScreen() {
  const { notifyChanged } = useTransactionChange();
  const {
    isScrollable,
    onContentSizeChange,
    onLayout,
    scrollHintOpacity,
    fabOpacity,
    fabTranslateX,
    onScroll,
  } = useScrollability(8);
  const flatListRef = useRef<FlatList<Transaction>>(null);

  const now = new Date();
  const [summaryRange, setSummaryRange] = useState<SummaryRange>('thisMonth');

  // 커스텀 선택용 연/월
  const [customYear, setCustomYear] = useState(now.getFullYear());
  const [customMonth, setCustomMonth] = useState(now.getMonth() + 1);

  // “연/월 선택 모달” 표시 여부
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const prevRangeRef = useRef<SummaryRange>('thisMonth');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigation = useNavigation<Navigation>();

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
    ],
    [navigation],
  );

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await getAllTransactions();
      setTransactions(data);
      notifyChanged();
    } catch (e) {
      console.error(e);
      alert('내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, []),
  );

  const handleFormSaved = () => {
    setShowForm(false);
    loadTransactions();
  };

  const handleDelete = (id?: number) => {
    if (!id) return;

    Alert.alert(
      '내역 삭제',
      '이 내역을 삭제할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransactionById(id);
              loadTransactions(); // 삭제 후 리스트 갱신
            } catch (e) {
              console.error(e);
              Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };
  const getFilterYearMonth = () => {
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth() + 1;

    if (summaryRange === 'thisMonth') {
      return { year: thisYear, month: thisMonth };
    }
    if (summaryRange === 'lastMonth') {
      let y = thisYear;
      let m = thisMonth - 1;
      if (m === 0) {
        m = 12;
        y -= 1;
      }
      return { year: y, month: m };
    }
    if (summaryRange === 'custom') {
      return { year: customYear, month: customMonth };
    }
    return null; // all
  };

  const filteredTransactions = transactions.filter((t) => {
    if (!t.date) return false;
    const ym = getFilterYearMonth();
    if (!ym) return true; // all

    const [y, m] = t.date.split('-').map(Number);
    if (!y || !m) return false;
    return y === ym.year && m === ym.month;
  });

  const getSummaryTotal = () => {
    if (transactions.length === 0) return 0;

    const ym = getFilterYearMonth();

    return transactions
      .filter((t) => {
        if (!t.date) return false;
        if (!ym) return true; // 'all' 이면 전체

        const [y, m] = t.date.split('-').map(Number);
        if (!y || !m) return false;
        return y === ym.year && m === ym.month;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const openCustomPicker = () => {
    prevRangeRef.current = summaryRange;
    setSummaryRange('custom');
    setShowMonthPicker(true);
  };

  const handlePickerConfirm = (year: number, month: number) => {
    setCustomYear(year);
    setCustomMonth(month);
    setShowMonthPicker(false);
  };

  const handlePickerCancel = () => {
    setSummaryRange(prevRangeRef.current);
    setShowMonthPicker(false);
  };

  return (
    <>
      <ScreenContainer>
        <Text style={theme.typography.title}>내역</Text>
        {/* 범위 선택 버튼 */}
        <View style={styles.summaryTabs}>
          <Pressable
            style={[styles.summaryTab, summaryRange === 'thisMonth' && styles.summaryTabActive]}
            onPress={() => setSummaryRange('thisMonth')}
          >
            <Text
              style={[
                styles.summaryTabText,
                summaryRange === 'thisMonth' && styles.summaryTabTextActive,
              ]}
            >
              이번 달
            </Text>
          </Pressable>

          <Pressable
            style={[styles.summaryTab, summaryRange === 'lastMonth' && styles.summaryTabActive]}
            onPress={() => setSummaryRange('lastMonth')}
          >
            <Text
              style={[
                styles.summaryTabText,
                summaryRange === 'lastMonth' && styles.summaryTabTextActive,
              ]}
            >
              지난 달
            </Text>
          </Pressable>

          <Pressable
            style={[styles.summaryTab, summaryRange === 'all' && styles.summaryTabActive]}
            onPress={() => setSummaryRange('all')}
          >
            <Text
              style={[styles.summaryTabText, summaryRange === 'all' && styles.summaryTabTextActive]}
            >
              전체
            </Text>
          </Pressable>

          <Pressable
            style={[styles.summaryTab, summaryRange === 'custom' && styles.summaryTabActive]}
            onPress={openCustomPicker}
          >
            <Text
              style={[
                styles.summaryTabText,
                summaryRange === 'custom' && styles.summaryTabTextActive,
              ]}
            >
              선택
            </Text>
          </Pressable>
        </View>

        {/* 요약 카드 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {summaryRange === 'thisMonth' && '이번 달 지출'}

            {summaryRange === 'lastMonth' && '지난 달 지출'}
            {summaryRange === 'all' && '전체 지출'}
            {summaryRange === 'custom' && `${customYear}년 ${customMonth}월 지출`}
          </Text>
          <Text style={styles.summaryAmount}>{formatWon(getSummaryTotal())}</Text>
        </View>
        {loading ? (
          <Text>불러오는 중...</Text>
        ) : transactions.length === 0 ? (
          <Text style={styles.emptyText}>
            아직 기록된 내역이 없습니다.{'\n'}
            아래 + 버튼으로 첫 지출을 추가해 보세요.
          </Text>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              onLayout={onLayout}
              onContentSizeChange={onContentSizeChange}
              onScroll={onScroll}
              scrollEventThrottle={16}
              data={filteredTransactions}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => item.id && navigation.navigate('EditTransaction', { id: item.id })}
                >
                  <View style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemCategory}>{item.mainCategory}</Text>
                      {item.subCategory && (
                        <Text style={styles.itemSubCategory}>{item.subCategory}</Text>
                      )}
                      {item.memo && <Text style={styles.itemMemo}>{item.memo}</Text>}
                    </View>

                    <View style={styles.itemRight}>
                      <View style={styles.amountRow}>
                        <Text
                          style={[
                            styles.itemAmount,
                            item.type === 'income' && styles.itemAmountIncome,
                          ]}
                        >
                          {item.type === 'income' ? '+' : '-'}
                          {formatWon(item.amount)}
                        </Text>
                      </View>
                      <Text style={styles.itemDate}>{item.date}</Text>
                      <Text style={styles.itemPayment}>{item.paymentMethod}</Text>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => handleDelete(item.id)}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.colors.textMuted} />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              )}
            />
            <ScrollHint
              scrollRef={flatListRef}
              visible={isScrollable}
              opacity={scrollHintOpacity}
            />
          </>
        )}

        <ExpandableFab actions={fabActions} fabOpacity={fabOpacity} fabTranslateX={fabTranslateX} />
      </ScreenContainer>

      <MonthYearPicker
        visible={showMonthPicker}
        year={customYear}
        month={customMonth}
        onConfirm={handlePickerConfirm}
        onCancel={handlePickerCancel}
        bottomOffset={0}
      />
    </>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemLeft: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  itemRight: {
    alignItems: 'flex-end',
    minWidth: 110,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs as any,
  },
  itemCategory: {
    ...theme.typography.body,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    fontSize: theme.typography.sizes.sm,
  },
  itemSubCategory: {
    ...theme.typography.body,
    fontSize: theme.typography.sizes.xs,
  },
  itemMemo: {
    ...theme.typography.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
  itemAmount: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  itemAmountIncome: {
    color: theme.colors.income,
  },
  itemDate: {
    ...theme.typography.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
  itemPayment: {
    ...theme.typography.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
  deleteButton: {
    padding: 4,
  },
  summaryTabs: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm as any,
  },
  summaryTab: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  summaryTabText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
  summaryTabTextActive: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  summaryCard: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  summaryTitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  summaryAmount: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});
