/**
 * 거래 변경 감지 Context
 * - 거래 추가/수정/삭제 시 changeTick 증가
 * - 구독 중인 화면들이 자동으로 데이터 리로드
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

type TransactionChangeContextType = {
    changeTick: number;
    notifyChanged: () => void;
};

const TransactionChangeContext = createContext<TransactionChangeContextType | null>(null);

export const TransactionChangeProvider = ({ children }: { children: ReactNode }) => {
    const [changeTick, setChangeTick] = useState(0);

    const notifyChanged = () => {
        setChangeTick(tick => tick + 1);
    };

    return (
        <TransactionChangeContext.Provider value={{ changeTick, notifyChanged }}>
            {children}
        </TransactionChangeContext.Provider>
    );
};

export const useTransactionChange = () => {
    const ctx = useContext(TransactionChangeContext);
    if (!ctx) {
        throw new Error('useTransactionChange must be used within TransactionChangeProvider');
    }
    return ctx;
};
