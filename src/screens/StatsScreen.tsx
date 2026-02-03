// src/screens/StatsScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    RefreshControl,
    Animated,
    Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../components/common/ScreenContainer';
import {
    getCategorySummary,
    getPaymentSummary,
    CategorySummaryRow,
    PaymentSummaryRow,
} from '../db/database';
import theme from '../theme';

type StatsMode = 'category' | 'payment';

function getThisMonthInfo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return { year, month };
}

export default function StatsScreen() {
    const [{ year, month }] = useState(getThisMonthInfo);
    const [mode, setMode] = useState<StatsMode>('category');
    const [categorySummary, setCategorySummary] = useState<CategorySummaryRow[]>([]);
    const [paymentSummary, setPaymentSummary] = useState<PaymentSummaryRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // 숨쉬기 애니메이션
    const scaleAnim = useRef(new Animated.Value(1)).current;

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
            ])
        ).start();
    };

    useEffect(() => {
        startBreathingAnimation();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const [catRows, payRows] = await Promise.all([
                getCategorySummary(year, month),
                getPaymentSummary(year, month),
            ]);
            setCategorySummary(catRows);
            setPaymentSummary(payRows);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // 탭에 들어올 때마다 자동 새로고침
    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [year, month])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    };

    const renderContent = () => {
        if (loading) {
            return <Text style={styles.bodyText}>계산 중...</Text>;
        }

        if (mode === 'category') {
            if (categorySummary.length === 0) {
                return <Text style={styles.bodyText}>이번 달 지출이 아직 없습니다.</Text>;
            }
            return categorySummary.map(row => (
                <View key={row.mainCategory} style={styles.row}>
                    <Text style={styles.rowLabel}>{row.mainCategory}</Text>
                    <Text style={styles.rowAmount}>{row.amount.toLocaleString()}원</Text>
                </View>
            ));
        } else {
            if (paymentSummary.length === 0) {
                return <Text style={styles.bodyText}>이번 달 지출이 아직 없습니다.</Text>;
            }
            return paymentSummary.map(row => (
                <View key={row.paymentMethod} style={styles.row}>
                    <Text style={styles.rowLabel}>{row.paymentMethod}</Text>
                    <Text style={styles.rowAmount}>{row.amount.toLocaleString()}원</Text>
                </View>
            ));
        }
    };

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
                    화면을 아래로 당기면 통계를 새로고침합니다
                </Animated.Text>

                <Text style={styles.title}>
                    {year}년 {month}월 통계
                </Text>

                {/* 상단 세그먼트: 카테고리 / 결제수단 */}
                <View style={styles.segmentContainer}>
                    <Pressable
                        style={[
                            styles.segmentButton,
                            mode === 'category' && styles.segmentButtonActive,
                        ]}
                        onPress={() => setMode('category')}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                mode === 'category' && styles.segmentTextActive,
                            ]}
                        >
                            카테고리별
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.segmentButton,
                            mode === 'payment' && styles.segmentButtonActive,
                        ]}
                        onPress={() => setMode('payment')}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                mode === 'payment' && styles.segmentTextActive,
                            ]}
                        >
                            결제수단별
                        </Text>
                    </Pressable>
                </View>

                {/* 내용 카드 */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        {mode === 'category' ? '카테고리별 지출' : '결제 수단별 지출'}
                    </Text>
                    {renderContent()}
                </View>
            </ScrollView>
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
    title: {
        ...theme.typography.title,
        marginBottom: theme.spacing.md,
    },
    segmentContainer: {
        flexDirection: 'row',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
        marginBottom: theme.spacing.md,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },
    segmentButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    segmentText: {
        ...theme.typography.body,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.textMuted,
    },
    segmentTextActive: {
        color: theme.colors.background,
        fontWeight: 'bold',
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
    bodyText: {
        ...theme.typography.body,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    rowLabel: {
        ...theme.typography.body,
    },
    rowAmount: {
        ...theme.typography.body,
        fontWeight: 'bold',
    },
});
