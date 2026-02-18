/**
 * 거래 추가 페이지 (지출/수입 등록)
 * - TransactionForm을 create 모드로 렌더링
 */
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import TransactionForm from '../components/transactions/TransactionForm';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;

export default function AddTransactionScreen({ route, navigation }: Props) {
  const { mode, initialDate } = route.params;

  return (
    <TransactionForm
      mode="create"
      type={mode}
      initialDate={initialDate}
      onSaved={() => {
        navigation.goBack();
      }}
      onCancel={() => {
        navigation.goBack();
      }}
    />
  );
}
