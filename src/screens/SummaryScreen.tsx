import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import ScreenContainer from '../components/common/ScreenContainer';
import theme from '../theme';
import {
    getMonthlySummary,
    getCategorySummary,
    getPaymentSummary,
    CategorySummaryRow,
    PaymentSummaryRow,
} from '../db/database';

export default function SummaryScreen() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    const [loading, setLoading] = useState(false);
    const [totalExpense, setTotalExpense] = useState(0);
    const [categoryRows, setCategoryRows] = useState<CategorySummaryRow[]>([]);
    const [paymentRows, setPaymentRows] = useState<PaymentSummaryRow[]>([]);

    const loadSummary = async (y: number, m: number) => {
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

    useEffect(() => {
        loadSummary(year, month);
    }, [year, month]);

    return (
        <ScreenContainer>
            <Text style={styles.title}>요약</Text>

            {/* TODO: 여기 연/월 선택 UI (지금 만든 커스텀 피커 재사용) */}

            {loading ? (
                <ActivityIndicator />
            ) : (
                <View style={{ gap: 16 }}>
                    {/* 총 지출 카드 */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            {year}년 {month}월 총 지출
                        </Text>
                        <Text style={styles.cardAmount}>
                            {totalExpense.toLocaleString()}원
                        </Text>
                    </View>

                    {/* 카테고리별 */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>카테고리별 지출</Text>
                        {categoryRows.length === 0 ? (
                            <Text style={styles.emptyText}>내역이 없습니다.</Text>
                        ) : (
                            <FlatList
                                data={categoryRows}
                                keyExtractor={item => item.mainCategory}
                                renderItem={({ item }) => (
                                    <View style={styles.row}>
                                        <Text style={styles.rowLabel}>{item.mainCategory}</Text>
                                        <Text style={styles.rowValue}>
                                            {item.amount.toLocaleString()}원
                                        </Text>
                                    </View>
                                )}
                            />
                        )}
                    </View>

                    {/* 결제 수단별 */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>결제 수단별 지출</Text>
                        {paymentRows.length === 0 ? (
                            <Text style={styles.emptyText}>내역이 없습니다.</Text>
                        ) : (
                            <FlatList
                                data={paymentRows}
                                keyExtractor={item => item.paymentMethod}
                                renderItem={({ item }) => (
                                    <View style={styles.row}>
                                        <Text style={styles.rowLabel}>{item.paymentMethod}</Text>
                                        <Text style={styles.rowValue}>
                                            {item.amount.toLocaleString()}원
                                        </Text>
                                    </View>
                                )}
                            />
                        )}
                    </View>
                </View>
            )}
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
    card: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
    },
    cardTitle: {
        fontSize: 14,
        color: theme.colors.textMuted,
        marginBottom: 4,
    },
    cardAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    emptyText: {
        fontSize: 13,
        color: theme.colors.textMuted,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    rowLabel: {
        fontSize: 14,
        color: theme.colors.text,
    },
    rowValue: {
        fontSize: 14,
        color: theme.colors.text,
        fontWeight: 'bold',
    },
});
