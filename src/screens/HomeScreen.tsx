import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import ScreenContainer from '../components/common/ScreenContainer';
import theme from '../theme';
import {
    getMonthlySummary,
    MonthlySummary,
    getRecentTransactionsOfMonth,
    Transaction,
    getTodayExpenseTotal,
    DailySummaryRow,
    getDailySummaryOfMonth
} from '../db/database';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import ScrollHint from '../components/common/ScrollHint';
import { RootStackParamList } from '../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AnimatedButton from '../components/common/AnimatedButton';
import { useScrollability } from '../hooks/useScrollability';

type Props = NativeStackScreenProps<RootStackParamList>;

export default function HomeScreen({ navigation }: Props) {
    const { isScrollable, onContentSizeChange, onLayout, scrollHintOpacity, onScroll } = useScrollability(8);

    const [{ year, month, remainingDays, todayStr }] = useState(getThisMonthInfo);
    const [todayExpense, setTodayExpense] = useState(0);

    const [summary, setSummary] = useState<MonthlySummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [recentRows, setRecentRows] = useState<Transaction[]>([]);
    const [dailySummary, setDailySummary] = useState<DailySummaryRow[]>([]);
    const [isAtTop, setIsAtTop] = useState(true); // 스크롤 Y가 0 근처인지
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const totalExpense = summary?.totalExpense ?? 0;
    const topCategories = summary?.byCategory.slice(0, 3) ?? [];

    const last3 = dailySummary.slice(-3);  // 날짜 ASC라면 뒤에서 3개
    const max = Math.max(...last3.map(r => r.amount), 1);

    useEffect(() => {
        startBreathingAnimation();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadSummary();
        }, [year, month])
    );

    const startBreathingAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.05,      // 살짝 커짐
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,         // 다시 원래 크기
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
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

        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const totalDays = lastDay.getDate();
        const remainingDays = totalDays - today + 1;

        return { year, month, remainingDays, todayStr };
    }


    return (
        <ScreenContainer>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                onContentSizeChange={onContentSizeChange}
                onLayout={onLayout}
                onScroll={onScroll}
                scrollEventThrottle={16}
            >

                <Animated.Text
                    style={[
                        styles.refreshHint,
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    화면을 아래로 당기면 새로고침 됩니다
                </Animated.Text>
                {/* 상단: 이번 달 기본 정보 */}
                <View style={styles.header}>
                    <Text style={styles.monthText}>
                        {year}년 {month}월 가계 요약
                    </Text>
                    <Text style={styles.subText}>
                        <Ionicons name="calendar-number-outline" size={16} color={theme.colors.textMuted} /> 이번 달 남은 일수: <Text style={{ fontWeight: 'bold' }}>{remainingDays}일</Text>
                    </Text>
                    <Text style={styles.todayText}>
                        <Ionicons name="alert-circle-outline" size={16} color={theme.colors.primary} /> 오늘 <Text style={{ color: theme.colors.primary }}>{todayExpense.toLocaleString()}</Text> 원 썼어요
                    </Text>
                </View>


                {/* 총 지출 박스 */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>이번 달 총 지출</Text>
                    {loading ? (
                        <Text style={styles.bodyText}>계산 중...</Text>
                    ) : (
                        <Text style={styles.totalAmount}>
                            {totalExpense.toLocaleString()}원
                        </Text>
                    )}
                    {/* 미니 막대 그래프 */}
                    {!loading && last3.length > 0 && (
                        <View style={styles.miniChartContainer}>
                            <Text style={styles.miniChartTitle}>
                                <Text >최근 3일 지출</Text><Text style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.textMuted }}> ({month}월)</Text>
                            </Text>

                            <View style={styles.miniChartBars}>
                                {last3.map(row => {
                                    const heightPercent = (row.amount / max) * 100;
                                    const day = row.date.split('-')[2]; // '03'

                                    return (
                                        <View key={row.date} style={styles.miniBarWrapper}>
                                            <View
                                                style={[
                                                    styles.miniBar,
                                                    { height: `${heightPercent}%` },
                                                ]}
                                            />
                                            <Text style={styles.miniBarLabel}>
                                                <Text style={{ fontWeight: 'bold' }}>{day}일</Text>
                                                <Text style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.textMuted }}>({row.amount.toLocaleString()}원)</Text>
                                            </Text>

                                        </View>
                                    );
                                })}
                            </View>
                            <Text style={styles.miniBarNotice}>*막대가 높을수록 많이 쓴 날이에요</Text>
                        </View>
                    )}

                </View>

                <View style={[styles.card, { paddingBottom: theme.spacing.xs }]}>
                    <Text style={styles.cardTitle}>최근 지출</Text>

                    {loading ? (
                        <Text style={styles.bodyText}>불러오는 중...</Text>
                    ) : recentRows.length === 0 ? (
                        <Text style={styles.bodyText}>아직 등록된 지출이 없습니다.</Text>
                    ) : (
                        recentRows.map(row => (
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
                                    <Text style={styles.recentAmount}>
                                        {row.amount.toLocaleString()}원
                                    </Text>
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
                        topCategories.map(cat => (
                            <View key={cat.mainCategory} style={styles.categoryRow}>
                                <Text style={styles.categoryName}>{cat.mainCategory}</Text>
                                <Text style={styles.categoryAmount}>
                                    {cat.amount.toLocaleString()}원
                                </Text>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>

            <View style={styles.addButtonWrapper}>
                <AnimatedButton
                    onPress={() => navigation.navigate('AddTransaction')}
                    style={styles.addButton}
                >
                    <Text style={styles.addButtonText}>지출 추가하기</Text>
                </AnimatedButton>
            </View>

            <ScrollHint
                visible={isScrollable}
                opacity={scrollHintOpacity}
            />
        </ScreenContainer>
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
    },
    refreshHint: {
        ...theme.typography.body,
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
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
        borderTopWidth: 1
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
    addButtonWrapper: {
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },

    addButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },

    addButtonText: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.background,
        fontWeight: 'bold',
    },
    todayText: {
        ...theme.typography.body,
        marginTop: theme.spacing.xs,
        color: theme.colors.text,      // 필요하면 primarySoft 같은 색으로 바꿔도 됨
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
        borderBottomWidth: 1
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

});
`   `