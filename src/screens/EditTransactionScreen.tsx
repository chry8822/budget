/**
 * 거래 수정 페이지 (지출/수입 수정)
 * - 기존 거래 데이터를 불러와 TransactionForm을 edit 모드로 렌더링
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import TransactionForm from '../components/transactions/TransactionForm';
import { RootStackParamList } from '../navigation/types';
import { getTransactionById, Transaction } from '../db/database';

type Props = NativeStackScreenProps<RootStackParamList, 'EditTransaction'>;

export default function EditTransactionScreen({ route, navigation }: Props) {
    const { id } = route.params;
    const [loading, setLoading] = useState(true);
    const [transaction, setTransaction] = useState<Transaction | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getTransactionById(id);
                if (!data) {
                    alert('해당 내역을 찾을 수 없습니다.');
                    navigation.goBack();
                    return;
                }
                setTransaction(data);
            } catch (e) {
                console.error(e);
                alert('내역을 불러오는 중 오류가 발생했습니다.');
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id, navigation]);

    if (loading || !transaction) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text>내역을 불러오는 중...</Text>
            </View>
        );
    }

    return (
        <TransactionForm
            mode="edit"
            type={transaction.type}
            initialTransaction={transaction}
            onSaved={() => {
                navigation.goBack();
            }}
            onCancel={() => {
                navigation.goBack();
            }}
        />
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
