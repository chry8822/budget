// src/screens/AddTransactionScreen.tsx
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import TransactionForm from '../components/transactions/TransactionForm';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;

export default function AddTransactionScreen({ navigation }: Props) {
    return (
        <TransactionForm
            mode="create"
            onSaved={() => {
                navigation.goBack();
            }}
            onCancel={() => {
                navigation.goBack();
            }}
        />
    );
}
