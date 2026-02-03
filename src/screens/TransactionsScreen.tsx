import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
} from 'react-native';
import ScreenContainer from '../components/common/ScreenContainer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { getAllTransactions, Transaction, deleteTransactionById } from '../db/database';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import { Alert } from 'react-native';


type Navigation = NativeStackNavigationProp<RootStackParamList>;
type SummaryRange = 'thisMonth' | 'lastMonth' | 'all' | 'custom';

const now = new Date();
const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 3 + i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

export default function TransactionsScreen() {
    const now = new Date();
    const [summaryRange, setSummaryRange] = useState<SummaryRange>('thisMonth');

    // 커스텀 선택용 연/월
    const [customYear, setCustomYear] = useState(now.getFullYear());
    const [customMonth, setCustomMonth] = useState(now.getMonth() + 1);

    // “연/월 선택 모달(또는 DatePicker)” 표시 여부
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const navigation = useNavigation<Navigation>();

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const data = await getAllTransactions();
            setTransactions(data);
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
            { cancelable: true }
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

        // 'all' 일 때는 연/월 필터 안 씀
        return null;
    };

    const getSummaryTotal = () => {
        if (transactions.length === 0) return 0;

        const ym = getFilterYearMonth();

        return transactions
            .filter(t => {
                if (!t.date) return false;
                if (!ym) return true; // 'all' 이면 전체

                const [y, m] = t.date.split('-').map(Number);
                if (!y || !m) return false;
                return y === ym.year && m === ym.month;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const filteredTransactions = transactions.filter(t => {
        if (!t.date) return false;
        const ym = getFilterYearMonth();
        if (!ym) return true; // 'all'

        const [y, m] = t.date.split('-').map(Number);
        if (!y || !m) return false;
        return y === ym.year && m === ym.month;
    });



    return (
        <>
            <ScreenContainer>
                <Text style={theme.typography.title}>내역</Text>
                {/* 범위 선택 버튼 */}
                <View style={styles.summaryTabs}>
                    {/* 이번 달 */}
                    <Pressable
                        style={[
                            styles.summaryTab,
                            summaryRange === 'thisMonth' && styles.summaryTabActive,
                        ]}
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

                    {/* 지난 달 */}
                    <Pressable
                        style={[
                            styles.summaryTab,
                            summaryRange === 'lastMonth' && styles.summaryTabActive,
                        ]}
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

                    {/* 전체 */}
                    <Pressable
                        style={[
                            styles.summaryTab,
                            summaryRange === 'all' && styles.summaryTabActive,
                        ]}
                        onPress={() => setSummaryRange('all')}
                    >
                        <Text
                            style={[
                                styles.summaryTabText,
                                summaryRange === 'all' && styles.summaryTabTextActive,
                            ]}
                        >
                            전체
                        </Text>
                    </Pressable>

                    {/* 선택 (커스텀) */}
                    <Pressable
                        style={[
                            styles.summaryTab,
                            summaryRange === 'custom' && styles.summaryTabActive,
                        ]}
                        onPress={() => {
                            setSummaryRange('custom');
                            setShowMonthPicker(true); // 👉 여기서 피커 열기
                        }}
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
                    <Text style={styles.summaryAmount}>
                        {getSummaryTotal().toLocaleString()}원
                    </Text>
                </View>

                {loading ? (
                    <Text>불러오는 중...</Text>
                ) : transactions.length === 0 ? (
                    <Text style={styles.emptyText}>아직 기록된 내역이 없습니다. 아래 + 버튼으로 첫 지출을 추가해 보세요.</Text>
                ) : (
                    <FlatList
                        data={filteredTransactions}
                        keyExtractor={item => String(item.id)}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() =>
                                    item.id && navigation.navigate('EditTransaction', { id: item.id })
                                }
                            >
                                <View style={styles.itemRow}>
                                    <View style={styles.itemLeft}>
                                        <Text style={styles.itemCategory}>{item.mainCategory}</Text>
                                        {item.subCategory && (
                                            <Text style={styles.itemSubCategory}>{item.subCategory}</Text>
                                        )}
                                        {item.memo && (
                                            <Text style={styles.itemMemo}>{item.memo}</Text>
                                        )}
                                    </View>

                                    <View style={styles.itemRight}>
                                        <View style={styles.amountRow}>
                                            <Text style={styles.itemAmount}>
                                                -{item.amount.toLocaleString()}원
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
                )}

                {/* 플로팅 + 버튼 */}
                <Pressable
                    style={styles.fab}
                    onPress={() => navigation.navigate('AddTransaction')}
                >
                    <Text style={styles.fabText}>＋</Text>
                </Pressable>

            </ScreenContainer>

            <Modal
                visible={showMonthPicker}
                transparent
                animationType="none"
                onRequestClose={() => setShowMonthPicker(false)}
            >
                <Pressable
                    style={styles.pickerOverlay}
                    onPress={() => setShowMonthPicker(false)}
                />
                <Pressable
                    style={styles.pickerContainer}
                    onPress={e => e.stopPropagation()}
                />

                <View style={styles.pickerOverlay}>
                    <Text style={styles.pickerTitle}>연 / 월 선택</Text>

                    <View style={styles.wheelRow}>
                        {/* 연도 휠 */}
                        <View style={styles.wheelColumn}>
                            <Text style={styles.wheelLabel}>년</Text>
                            <View style={styles.wheelBox}>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                >
                                    {years.map(y => (
                                        <Pressable
                                            key={y}
                                            style={[
                                                styles.wheelItem,
                                                customYear === y && styles.wheelItemActive,
                                            ]}
                                            onPress={() => setCustomYear(y)}
                                        >
                                            <Text
                                                style={[
                                                    styles.wheelItemText,
                                                    customYear === y && styles.wheelItemTextActive,
                                                ]}
                                            >
                                                {y}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        {/* 월 휠 */}
                        <View style={styles.wheelColumn}>
                            <Text style={styles.wheelLabel}>월</Text>
                            <View style={styles.wheelBox}>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                >
                                    {months.map(m => (
                                        <Pressable
                                            key={m}
                                            style={[
                                                styles.wheelItem,
                                                customMonth === m && styles.wheelItemActive,
                                            ]}
                                            onPress={() => setCustomMonth(m)}
                                        >
                                            <Text
                                                style={[
                                                    styles.wheelItemText,
                                                    customMonth === m && styles.wheelItemTextActive,
                                                ]}
                                            >
                                                {m}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </View>

                    {/* 하단 버튼 */}
                    <View style={styles.pickerButtonsRow}>
                        <Pressable
                            style={styles.pickerButton}
                            onPress={() => setShowMonthPicker(false)}
                        >
                            <Text style={styles.pickerButtonText}>취소</Text>
                        </Pressable>
                        <Pressable
                            style={styles.pickerButtonPrimary}
                            onPress={() => {
                                // customYear / customMonth로 필터링 이미 반영됨
                                setShowMonthPicker(false);
                            }}
                        >
                            <Text style={styles.pickerButtonPrimaryText}>확인</Text>
                        </Pressable>
                    </View>

                </View>
            </Modal>


            {/* <Modal visible={showForm} animationType="slide">
                <TransactionForm
                    onSaved={handleFormSaved}
                    onCancel={() => setShowForm(false)}
                />
            </Modal> */}
        </>
    );
}

const styles = StyleSheet.create({
    emptyText: {
        fontSize: theme.typography.body.fontSize,
        color: theme.colors.textMuted,
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

    fab: {
        position: 'absolute',
        right: theme.spacing.lg,
        bottom: theme.spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
    },
    fabText: {
        fontSize: theme.typography.sizes.display,
        color: theme.colors.background,
        lineHeight: theme.typography.sizes.display,
    },
    summaryCard: {
        marginTop: 12,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: theme.colors.surface, // 혹은 살짝 강조되는 색
        elevation: 2, // 안드
        shadowColor: '#000', // iOS
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    summaryTitle: {
        fontSize: 14,
        color: theme.colors.textMuted,
        marginBottom: 4,
    },
    summaryAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    summaryTabs: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    summaryTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    summaryTabActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    summaryTabText: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },
    summaryTabTextActive: {
        color: '#fff',
    },
    monthPickerRow: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 8,
    },
    monthPickerButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    monthPickerText: {
        fontSize: 14,
        color: theme.colors.text,
    },

    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',  // ✅ 딤
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    pickerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    pickerRow: {
        flexDirection: 'row',
        gap: 16,
    },
    pickerColumn: {
        flex: 1,
    },
    pickerLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    pickerOption: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    pickerOptionActive: {
        backgroundColor: theme.colors.primary + '22',
    },
    pickerOptionText: {
        fontSize: 14,
    },
    pickerOptionTextActive: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    pickerButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
        gap: 8,
    },
    pickerButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    pickerButtonText: {
        fontSize: 14,
        color: theme.colors.textMuted,
    },
    pickerButtonPrimary: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
    },
    pickerButtonPrimaryText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
    },

    wheelRow: {
        flexDirection: 'row',
        marginTop: 8,
        marginBottom: 12,
    },
    wheelColumn: {
        flex: 1,
        alignItems: 'center',
    },
    wheelLabel: {
        fontSize: 13,
        color: '#888',
        marginBottom: 4,
    },
    wheelBox: {
        height: 160,              // 스와이프 영역 높이
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        overflow: 'hidden',
    },
    wheelItem: {
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelItemActive: {
        backgroundColor: '#f0f4ff',
    },
    wheelItemText: {
        fontSize: 16,
        color: '#555',
    },
    wheelItemTextActive: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },


});
