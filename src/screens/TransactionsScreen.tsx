import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Modal,
    Pressable,
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

export default function TransactionsScreen() {
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

    return (
        <>
            <ScreenContainer>
                <Text style={theme.typography.title}>내역</Text>

                {loading ? (
                    <Text>불러오는 중...</Text>
                ) : transactions.length === 0 ? (
                    <Text style={styles.emptyText}>아직 기록된 내역이 없습니다. 아래 + 버튼으로 첫 지출을 추가해 보세요.</Text>
                ) : (
                    <FlatList
                        data={transactions}
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

});
