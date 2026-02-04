// TransactionChangeContext.tsx
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
