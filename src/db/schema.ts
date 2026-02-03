// src/db/schema.ts
export const DB_NAME = 'family_budget.db';

export const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,             -- 'expense' | 'income'
    mainCategory TEXT NOT NULL,     -- 대분류 (식비, 고정지출 등)
    subCategory TEXT,               -- 소분류 (마트, 대출이자 등)
    paymentMethod TEXT NOT NULL,    -- 결제수단 (현금, 카드 등)
    memo TEXT,                      -- 메모
    createdAt TEXT NOT NULL         -- 생성 시각 (ISO 문자열)
  );
`;
