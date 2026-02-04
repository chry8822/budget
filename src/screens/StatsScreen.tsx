// src/screens/StatsScreen.tsx
import {
    PieChart,
    BarChart,
} from 'react-native-chart-kit';

import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, ActivityIndicator } from 'react-native';

import {
    StyleSheet,
    View,
    Text,
    Pressable,
    ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../components/common/ScreenContainer';
import {
    getMonthlySummary,
    getCategorySummary,
    getPaymentSummary,
    CategorySummaryRow,
    PaymentSummaryRow,
} from '../db/database';
import theme from '../theme';
import MonthYearPicker from '../components/common/MonthYearPicker';

type StatsRange = 'thisMonth' | 'lastMonth' | 'custom';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - theme.spacing.md * 2;

const pieColors = [
    '#87C2CA', // 민트
    '#DF93B4', // 핑크
    '#F1C764', // 옅은 옐로우
    '#47B39C', // 티얼
    '#EC6B56', // 코랄
    '#A855F7', // 퍼플
];

const barColors = [
    '#87C2CA',
    '#DF93B4',
    '#F1C764',
    '#47B39C',
    '#EC6B56',
    '#A855F7',
];

const topN = 5;

export default function StatsScreen() {
    const now = new Date();

    const [range, setRange] = useState<StatsRange>('thisMonth');
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [customYear, setCustomYear] = useState(year);
    const [customMonth, setCustomMonth] = useState(month);

    const [totalExpense, setTotalExpense] = useState(0);
    const [categoryRows, setCategoryRows] = useState<CategorySummaryRow[]>([]);
    const [paymentRows, setPaymentRows] = useState<PaymentSummaryRow[]>([]);

    const [loading, setLoading] = useState(false);

    // 카테고리 데이터 정리
    const totalForPie = categoryRows.reduce(
        (sum, r) => sum + (r.amount || 0),
        0,
    );

    const sortedCategoryRows = [...categoryRows].sort(
        (a, b) => b.amount - a.amount,
    );

    const topRows = sortedCategoryRows.slice(0, topN);
    const othersRows = sortedCategoryRows.slice(topN);
    const othersTotal = othersRows.reduce((s, r) => s + r.amount, 0);

    const paymentTotal = paymentRows.reduce(
        (sum, r) => sum + (r.amount || 0),
        0,
    );
    const chartConfig = {
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        color: (opacity = 1) => `rgba(71, 179, 156, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(120, 120, 120, ${opacity})`,
        propsForBackgroundLines: {
            stroke: '#eee',
        },
        formatYLabel: (value: string) => {
            // value는 "0", "50", "100" 이런 문자열 (만원 단위)
            const n = Math.round(Number(value));
            if (Number.isNaN(n)) return value;
            return `${n} 만`; // 50만, 100만 처럼 표시
        },
    };

    const categoryPieData = sortedCategoryRows.map((row, idx) => ({
        name: row.mainCategory,
        amount: row.amount,
        color: pieColors[idx % pieColors.length],
        legendFontColor: theme.colors.textMuted,
        legendFontSize: 12,
    }));

    const loadStats = async () => {
        const { year: y, month: m } = getTargetYearMonth();
        setYear(y);
        setMonth(m);

        setLoading(true);
        try {
            const monthly = await getMonthlySummary(y, m);
            const cats = await getCategorySummary(y, m);
            const pays = await getPaymentSummary(y, m);

            setTotalExpense(monthly.totalExpense);
            setCategoryRows(cats);
            setPaymentRows(pays);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // 탭에 들어올 때마다 자동 새로고침
    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [range, customYear, customMonth])
    );

    const handlePickerConfirm = (y: number, m: number) => {
        setCustomYear(y);
        setCustomMonth(m);
        setShowMonthPicker(false);
        setRange('custom');
    };

    const handlePickerCancel = () => {
        setShowMonthPicker(false);
    };

    useEffect(() => {
        loadStats();
    }, [range, customYear, customMonth]);

    const getTargetYearMonth = () => {
        const now = new Date();
        const thisYear = now.getFullYear();
        const thisMonth = now.getMonth() + 1;

        if (range === 'thisMonth') return { year: thisYear, month: thisMonth };
        if (range === 'lastMonth') {
            let y = thisYear;
            let m = thisMonth - 1;
            if (m === 0) {
                m = 12;
                y -= 1;
            }
            return { year: y, month: m };
        }
        return { year: customYear, month: customMonth };
    };

    const barData = {
        labels: paymentRows.map(r => r.paymentMethod),
        datasets: [
            {
                data: paymentRows.map((r => Math.round(r.amount / 10000))), // 금액 → 만원 단위
            },
        ],
    };


    return (
        <>
            <ScreenContainer>
                <ScrollView
                    contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.title}>통계</Text>

                    {/* 기간 선택 버튼 */}
                    <View style={styles.headerRow}>
                        <View style={styles.rangeTabs}>
                            <Pressable
                                style={[
                                    styles.rangeTab,
                                    range === 'thisMonth' && styles.rangeTabActive,
                                ]}
                                onPress={() => setRange('thisMonth')}
                            >
                                <Text
                                    style={[
                                        styles.rangeTabText,
                                        range === 'thisMonth' && styles.rangeTabTextActive,
                                    ]}
                                >
                                    이번 달
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.rangeTab,
                                    range === 'lastMonth' && styles.rangeTabActive,
                                ]}
                                onPress={() => setRange('lastMonth')}
                            >
                                <Text
                                    style={[
                                        styles.rangeTabText,
                                        range === 'lastMonth' && styles.rangeTabTextActive,
                                    ]}
                                >
                                    지난 달
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.rangeTab,
                                    range === 'custom' && styles.rangeTabActive,
                                ]}
                                onPress={() => {
                                    // setRange('custom');
                                    setShowMonthPicker(true);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.rangeTabText,
                                        range === 'custom' && styles.rangeTabTextActive,
                                    ]}
                                >
                                    선택
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    <Text style={styles.subtitle}>
                        {year}년 {month}월 통계
                    </Text>

                    {loading ? (
                        <ActivityIndicator />
                    ) : (
                        <View style={{ gap: 5 }}>
                            {/* 총 지출 카드 */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>총 지출</Text>
                                <Text style={styles.rowValueBold}>
                                    {totalExpense.toLocaleString()}원
                                </Text>
                            </View>

                            {/* 카테고리별 (그래프 자리) */}
                            <View style={styles.card}>
                                <View style={styles.cardHeaderRow}>
                                    <Text style={styles.cardTitle}>카테고리별 지출</Text>
                                    {totalForPie > 0 && (
                                        <Text style={styles.cardSubtitle}>
                                            총 {totalForPie.toLocaleString()}원
                                        </Text>
                                    )}
                                </View>

                                {sortedCategoryRows.length === 0 ? (
                                    <Text style={styles.emptyText}>내역이 없습니다.</Text>
                                ) : (
                                    <View style={styles.pieRow}>
                                        {/* 왼쪽: 작게 줄인 파이 */}
                                        <View style={styles.pieCol}>
                                            <PieChart
                                                data={categoryPieData}
                                                width={chartWidth * 0.4}   // 0.4 → 0.32 로 축소
                                                height={chartWidth * 0.4}
                                                chartConfig={chartConfig}
                                                accessor="amount"
                                                backgroundColor="transparent"
                                                paddingLeft="30"
                                                hasLegend={false}
                                                center={[0, 0]}
                                            />
                                        </View>

                                        {/* 오른쪽: 레전드 */}
                                        <View style={styles.legendCol}>
                                            {topRows.map((row, idx) => {
                                                const percent =
                                                    totalForPie > 0
                                                        ? Math.round((row.amount / totalForPie) * 100)
                                                        : 0;

                                                return (
                                                    <View key={row.mainCategory} style={styles.row}>
                                                        <View style={styles.rowLeft}>
                                                            <View
                                                                style={[
                                                                    styles.colorDot,
                                                                    { backgroundColor: pieColors[idx % pieColors.length] },
                                                                ]}
                                                            />
                                                            <Text style={styles.rowLabel}>{row.mainCategory}</Text>
                                                        </View>
                                                        <View style={{ alignItems: 'flex-end' }}>
                                                            <Text style={styles.rowValue}>
                                                                {row.amount.toLocaleString()}원
                                                            </Text>
                                                            <Text style={styles.rowPercent}>{percent}%</Text>
                                                        </View>
                                                    </View>
                                                );
                                            })}

                                            {othersTotal > 0 && (
                                                <View style={styles.row}>
                                                    <View style={styles.rowLeft}>
                                                        <View
                                                            style={[
                                                                styles.colorDot,
                                                                { backgroundColor: '#DDDEDF' },
                                                            ]}
                                                        />
                                                        <Text style={styles.rowLabel}>기타</Text>
                                                    </View>
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <Text style={styles.rowValue}>
                                                            {othersTotal.toLocaleString()}원
                                                        </Text>
                                                        <Text style={styles.rowPercent}>
                                                            {Math.round((othersTotal / totalForPie) * 100)}%
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>


                                    </View>
                                )}
                            </View>


                            {/* 결제 수단별 (그래프 자리) */}
                            <View style={styles.card}>
                                <View style={styles.cardHeaderRow}>
                                    <Text style={styles.cardTitle}>결제 수단별 지출</Text>
                                    {paymentTotal > 0 && (
                                        <Text style={styles.cardSubtitle}>
                                            총 {paymentTotal.toLocaleString()}원
                                        </Text>
                                    )}
                                </View>

                                {paymentRows.length === 0 ? (
                                    <Text style={styles.emptyText}>내역이 없습니다.</Text>
                                ) : (
                                    <>
                                        {/* 위: 전체 형태만 보여주는 BarChart */}
                                        <View style={styles.barChartWrapper}>
                                            <BarChart
                                                data={barData}
                                                width={chartWidth}
                                                height={180}
                                                fromZero
                                                withInnerLines={true}
                                                withHorizontalLabels={true}  // false → true : y축 기준값 복구
                                                yAxisLabel=""
                                                yAxisSuffix="원"
                                                chartConfig={{
                                                    ...chartConfig,
                                                    color: (opacity = 1) =>
                                                        `rgba(71, 179, 156, ${opacity})`, // 조금 더 진한 티얼
                                                    labelColor: (opacity = 1) =>
                                                        `rgba(80, 80, 80, ${opacity})`,
                                                }}
                                                style={{ borderRadius: 12 }}
                                                showValuesOnTopOfBars={false}
                                            />

                                        </View>

                                        {/* 아래: 실제 정보(색 + 금액 + 퍼센트) */}
                                        <View style={{ marginTop: theme.spacing.xs }}>
                                            {paymentRows.map((row, idx) => {
                                                const percent =
                                                    totalForPie > 0
                                                        ? Math.round((row.amount / totalForPie) * 100)
                                                        : 0;

                                                return (
                                                    <View key={row.paymentMethod} style={styles.row}>
                                                        <View style={styles.rowLeft}>
                                                            <View
                                                                style={[
                                                                    styles.colorDot,
                                                                    { backgroundColor: barColors[idx % barColors.length] },
                                                                ]}
                                                            />
                                                            <Text style={styles.rowLabel}>{row.paymentMethod}</Text>
                                                        </View>
                                                        <View style={{ alignItems: 'flex-end' }}>
                                                            <Text style={styles.rowValue}>
                                                                {row.amount.toLocaleString()}원
                                                            </Text>
                                                            <Text style={styles.rowPercent}>{percent}%</Text>
                                                        </View>
                                                    </View>
                                                );
                                            })}

                                        </View>
                                    </>
                                )}
                            </View>



                        </View>
                    )}
                </ScrollView>
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
    container: {
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.sm,
    },
    title: {
        fontSize: theme.typography.title.fontSize,
        fontWeight: 'bold',
        marginBottom: theme.spacing.sm,
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: theme.typography.body.fontSize,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.xs,
    },
    // 상단 기간 탭 + 선택 월 표시
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    rangeTabs: {
        flexDirection: 'row',
        gap: theme.spacing.xs as any,
    },
    rangeTab: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    rangeTabActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    rangeTabText: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
    },
    rangeTabTextActive: {
        color: theme.colors.background,
        fontWeight: 'bold',
    },
    currentMonthText: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
    },

    // 카드 공통
    card: {
        padding: theme.spacing.md,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        marginTop: theme.spacing.sm,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    cardTitle: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.textMuted,
    },
    cardSubtitle: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
    },
    emptyText: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.sm,
    },

    // 카테고리/결제 리스트 행
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 2,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rowLabel: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
    },
    rowValueBold: {
        fontSize: theme.typography.sizes.lg,
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    rowValue: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    rowPercent: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
    },
    pieChartWrapper: {
        marginVertical: theme.spacing.sm,
    },

    colorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    barChartWrapper: {
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
    },
    pieRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.xs,   // 여유
    },
    pieCol: {
        flex: 0.45,        // 0.4 → 0.38
        alignItems: 'center',
    },
    legendCol: {
        flex: 0.55
    },
});


