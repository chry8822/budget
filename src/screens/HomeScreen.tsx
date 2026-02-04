import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import ScreenContainer from '../components/common/ScreenContainer';
import theme from '../theme';
import {
    getMonthlySummary,
    MonthlySummary,
    getRecentTransactionsOfMonth,
    Transaction,
} from '../db/database';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';


function getThisMonthInfo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 0~11 -> 1~12
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const today = now.getDate();

    const totalDays = lastDay.getDate();
    const remainingDays = totalDays - today + 1;

    return { year, month, totalDays, remainingDays };
}

export default function HomeScreen() {
    const [{ year, month, remainingDays }] = useState(getThisMonthInfo);
    const [summary, setSummary] = useState<MonthlySummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [recentRows, setRecentRows] = useState<Transaction[]>([]);
    const scaleAnim = useRef(new Animated.Value(1)).current;

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

            setRecentRows(recents);
            setSummary(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadSummary();
        setRefreshing(false);
    };

    useEffect(() => {
        startBreathingAnimation();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadSummary();
        }, [year, month])
    );

    const totalExpense = summary?.totalExpense ?? 0;
    const topCategories = summary?.byCategory.slice(0, 3) ?? [];

    return (
        <ScreenContainer>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
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
                        이번 달 남은 일수: {remainingDays}일
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
                </View>

                <View style={styles.card}>
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
            {/* 나중에: 고정/변동, 그래프 섹션 추가 가능 */}
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
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardTitle: {
        ...theme.typography.subtitle,
        fontWeight: 'bold',
        marginBottom: theme.spacing.sm,
    },
    cardHint: {
        ...theme.typography.body,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.sm,
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
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
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

});
