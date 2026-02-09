import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import ScreenContainer from '../components/common/ScreenContainer';
import theme from '../theme';
import {
    getMonthlySummary,
    getCategorySummary,
    getPaymentSummary,
    CategorySummaryRow,
    PaymentSummaryRow,
    MonthlySummary,
} from '../db/database';
import { useTransactionChange } from '../components/common/TransactionChangeContext';
import { formatAmount, formatWon } from '../utils/format';
import ScrollHint from '../components/common/ScrollHint';
import { useScrollability } from '../hooks/useScrollability';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

export default function SummaryScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const { changeTick } = useTransactionChange();

    const now = new Date();
    const today = now.getDate();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    const [loading, setLoading] = useState(false);

    const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
    const [topCategories, setTopCategories] = useState<CategorySummaryRow[]>([]);
    const [topPayment, setTopPayment] = useState<PaymentSummaryRow[]>([]);

    const [prevMonthlySummary, setPrevMonthlySummary] = useState<MonthlySummary | null>(null);
    const [prevTopCategory, setPrevTopCategory] = useState<CategorySummaryRow | null>(null);
    const [prevTopPayment, setPrevTopPayment] = useState<PaymentSummaryRow | null>(null);
    const { isScrollable, onContentSizeChange, onLayout, scrollHintOpacity, onScroll } = useScrollability(8);

    const getDaysInMonth = (y: number, m: number) =>
        new Date(y, m, 0).getDate();

    const daysInMonth = getDaysInMonth(year, month);

    // Stats에 있는 getTargetYearMonth 재사용
    const loadSummary = async () => {
        setLoading(true);
        try {
            const currentMonthly = await getMonthlySummary(year, month);
            const currentCats = await getCategorySummary(year, month);
            const currentPays = await getPaymentSummary(year, month);

            const { year: py, month: pm } = getPrevYearMonth(year, month);
            const prevMonthly = await getMonthlySummary(py, pm);
            const prevCats = await getCategorySummary(py, pm);
            const prevPays = await getPaymentSummary(py, pm);

            setMonthlySummary(currentMonthly);
            setTopCategories(currentCats.slice(0, 3));
            setTopPayment(currentPays.slice(0, 3));

            setPrevMonthlySummary(prevMonthly);
            setPrevTopCategory(prevCats[0] ?? null);
            setPrevTopPayment(prevPays[0] ?? null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSummary();
    }, [year, month, changeTick]);

    const getPrevYearMonth = (y: number, m: number) => {
        if (m === 1) {
            return { year: y - 1, month: 12 };
        }
        return { year: y, month: m - 1 };
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



    return (
        <ScreenContainer>
            <ScrollView
                onLayout={onLayout}
                onContentSizeChange={onContentSizeChange}
                onScroll={onScroll}
                scrollEventThrottle={16}
            >
                <View style={styles.headerRow}>
                    <Text style={styles.title}>요약</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('BudgetSetting')}>
                        <Text style={styles.budgetLink}>예산 설정</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>이번 달 지출 요약이에요.</Text>

                {/* TODO: 여기 연/월 선택 UI (지금 만든 커스텀 피커 재사용) */}

                {loading ? (
                    <ActivityIndicator />
                ) : (
                    <>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>총 지출</Text>
                            <Text style={styles.cardAmount}>
                                {formatWon(monthlySummary?.totalExpense ?? 0)}
                            </Text>
                            <Text style={styles.cardSubtitle}>
                                하루 평균 <Text style={{ fontWeight: 'bold' }}>
                                    {daysInMonth > 0
                                        ? formatWon(Math.round((monthlySummary?.totalExpense ?? 0) / today))
                                        : '0원'}
                                </Text> <Text style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.textMuted }}>({month}/{today} 기준)</Text>
                            </Text>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>카테고리 TOP 3</Text>
                            {topCategories.length === 0 ? (
                                <Text style={styles.emptyText}>내역이 없습니다.</Text>
                            ) : (
                                topCategories.map(row => (
                                    <View key={row.mainCategory} style={styles.row}>
                                        <Text style={styles.rowLabel}>{row.mainCategory}</Text>
                                        <Text style={styles.rowValue}>
                                            {formatWon(row.amount)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>가장 많이 쓴 결제 수단 TOP 3</Text>
                            {topPayment.length === 0 ? (
                                <Text style={styles.emptyText}>내역이 없습니다.</Text>
                            ) : (
                                topPayment?.map(row => (
                                    <View key={row.paymentMethod} style={styles.row}>
                                        <Text style={styles.rowLabel}>{row.paymentMethod}</Text>
                                        <Text style={styles.rowValue}>
                                            {formatWon(row.amount)}
                                        </Text>
                                    </View>
                                ))

                            )}
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>저번 달과 비교</Text>

                            {/* 헤더 */}
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
                                    <Text style={styles.compareSubText}>
                                        ({topCategories[0]?.mainCategory ?? '-'})
                                    </Text>
                                </View>
                                <View style={styles.compareCellValueColumn}>
                                    <Text style={styles.compareCellValueText}>
                                        {formatAmount(prevTopCategory?.amount ?? 0)}
                                    </Text>
                                    <Text style={styles.compareSubText}>
                                        ({prevTopCategory?.mainCategory ?? '-'})
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.compareRow, !prevMonthlySummary && styles.compareRowLast]}>
                                <Text style={styles.compareCellLabel}>결제 수단 1위</Text>
                                <View style={styles.compareCellValueColumn}>
                                    <Text style={styles.compareCellValueText}>
                                        {formatAmount(topPayment[0]?.amount ?? 0)}
                                    </Text>
                                    <Text style={styles.compareSubText}>
                                        ({topPayment[0]?.paymentMethod ?? '-'})
                                    </Text>
                                </View>
                                <View style={styles.compareCellValueColumn}>
                                    <Text style={styles.compareCellValueText}>
                                        {formatAmount(prevTopPayment?.amount ?? 0)}
                                    </Text>
                                    <Text style={styles.compareSubText}>
                                        ({prevTopPayment?.paymentMethod ?? '-'})
                                    </Text>
                                </View>
                            </View>


                            {/* 표 행들 */}

                            {prevMonthlySummary && (
                                <Text style={[styles.diffText, { marginTop: theme.spacing.sm }]}>
                                    {renderExpenseDiff(
                                        monthlySummary?.totalExpense ?? 0,
                                        prevMonthlySummary.totalExpense
                                    )}
                                </Text>
                            )}

                        </View>
                    </>
                )}
            </ScrollView>
            <ScrollHint visible={isScrollable} opacity={scrollHintOpacity} />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
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
    card: {
        padding: theme.spacing.md,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        marginBottom: theme.spacing.md,
    },
    cardTitle: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.xs,
        fontWeight: 'bold',
    },
    cardAmount: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    cardSubtitle: {
        marginTop: theme.spacing.xs,
        fontSize: theme.typography.sizes.md,
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
    compareRowLast: {
        borderBottomWidth: 0,
    },

    // 왼쪽: 항목명 (짧은 텍스트)
    compareCellLabel: {
        flex: 1,                        // 전체의 1/3 정도
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
    },

    // 가운데/오른쪽: 값
    compareCellValue: {
        flex: 0.5,                        // 둘이 합쳐 2/3
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
    compareInnerValue: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginLeft: theme.spacing.sm,
    },
    compareInnerName: {
        flexShrink: 1,                              // 이름 부분만 줄어들게
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
        textAlign: 'right',
    },
    compareInnerAmount: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    budgetLink: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.primary,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: 12,
        padding: theme.spacing.xs,
        marginLeft: theme.spacing.sm,
    },


});
