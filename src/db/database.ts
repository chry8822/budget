// src/db/database.ts
import * as SQLite from 'expo-sqlite';
import { DB_NAME, CREATE_TRANSACTIONS_TABLE } from './schema';
import { MainCategory, PaymentMethod, TransactionType } from '../types/transaction';

export type Transaction = {
  id?: number;
  date: string;          // '2026-02-03'
  amount: number;
  type: TransactionType;
  mainCategory: MainCategory;
  subCategory?: string;
  paymentMethod: PaymentMethod;
  memo?: string;
  createdAt: string;     // new Date().toISOString()
};

// 새 버전: 동기 방식으로 DB 핸들 얻기
const db = SQLite.openDatabaseSync(DB_NAME); // SQLiteDatabase 타입[web:130][web:170]

// 앱 시작 시 테이블을 준비하는 함수
export async function initDatabase(): Promise<void> {
  try {
    // execAsync: 여러 SQL을 한꺼번에 실행할 수 있음
    await db.execAsync(CREATE_TRANSACTIONS_TABLE);
    console.log('transactions 테이블 준비 완료');
  } catch (error) {
    console.error('테이블 생성 중 에러', error);
    throw error;
  }
}

// 한 건 추가
export async function insertTransaction(t: Omit<Transaction, 'id'>): Promise<void> {
  try {
    await db.runAsync(
      `
      INSERT INTO transactions
      (date, amount, type, mainCategory, subCategory, paymentMethod, memo, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        t.date,
        t.amount,
        t.type,
        t.mainCategory,
        t.subCategory ?? null,
        t.paymentMethod,
        t.memo ?? null,
        t.createdAt,
      ]
    );
  } catch (error) {
    console.error('insertTransaction 에러', error);
    throw error;
  }
}

// 전체 내역 조회
export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    const rows = await db.getAllAsync<Transaction>(
      `
      SELECT * FROM transactions
      ORDER BY date DESC, createdAt DESC;
      `,
      []
    );
    // getAllAsync는 이미 배열을 반환하므로 바로 리턴[web:130][web:167]
    return rows;
  } catch (error) {
    console.error('getAllTransactions 에러', error);
    throw error;
  }
}

// 이번 달(YYYY-MM 기준) 지출 통계를 가져오는 함수
export type MonthlySummary = {
    totalExpense: number;
    byCategory: { mainCategory: string; amount: number }[];
  };
  
  export async function getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
    // month: 1~12
    const monthStr = month.toString().padStart(2, '0');
    const prefix = `${year}-${monthStr}`; // 예: 2026-02
  
    try {
      // 총 지출
      const totalRows = await db.getAllAsync<{ total: number }>(
        `
        SELECT SUM(amount) as total
        FROM transactions
        WHERE type = 'expense'
          AND date LIKE ?;
        `,
        [`${prefix}%`]
      );
  
      const totalExpense = totalRows[0]?.total ?? 0;
  
      // 카테고리별 합계
      const categoryRows = await db.getAllAsync<{ mainCategory: string; amount: number }>(
        `
        SELECT mainCategory, SUM(amount) as amount
        FROM transactions
        WHERE type = 'expense'
          AND date LIKE ?
        GROUP BY mainCategory
        ORDER BY amount DESC;
        `,
        [`${prefix}%`]
      );
  
      return {
        totalExpense,
        byCategory: categoryRows,
      };
    } catch (error) {
      console.error('getMonthlySummary 에러', error);
      throw error;
    }
  }

  export type CategorySummaryRow = {
    mainCategory: string;
    amount: number;
  };
  
  export async function getCategorySummary(year: number, month: number): Promise<CategorySummaryRow[]> {
    const monthStr = month.toString().padStart(2, '0');
    const prefix = `${year}-${monthStr}`; // 예: 2026-02
  
    try {
      const rows = await db.getAllAsync<CategorySummaryRow>(
        `
        SELECT mainCategory, SUM(amount) AS amount
        FROM transactions
        WHERE type = 'expense'
          AND date LIKE ?
        GROUP BY mainCategory
        ORDER BY amount DESC;
        `,
        [`${prefix}%`]
      );
      return rows;
    } catch (error) {
      console.error('getCategorySummary 에러', error);
      throw error;
    }
  }
  
  export type PaymentSummaryRow = {
    paymentMethod: string;
    amount: number;
  };
  
  export async function getPaymentSummary(year: number, month: number): Promise<PaymentSummaryRow[]> {
    const monthStr = month.toString().padStart(2, '0');
    const prefix = `${year}-${monthStr}`;
  
    try {
      const rows = await db.getAllAsync<PaymentSummaryRow>(
        `
        SELECT paymentMethod, SUM(amount) AS amount
        FROM transactions
        WHERE type = 'expense'
          AND date LIKE ?
        GROUP BY paymentMethod
        ORDER BY amount DESC;
        `,
        [`${prefix}%`]
      );
      return rows;
    } catch (error) {
      console.error('getPaymentSummary 에러', error);
      throw error;
    }
  }
  
  export async function deleteTransactionById(id: number): Promise<void> {
    try {
      await db.runAsync(
        `
        DELETE FROM transactions
        WHERE id = ?;
        `,
        [id]
      );
    } catch (error) {
      console.error('deleteTransactionById 에러', error);
      throw error;
    }
  }
  
  // 단일 내역 조회
export async function getTransactionById(id: number): Promise<Transaction | null> {
  try {
    const rows = await db.getAllAsync<Transaction>(
      `
      SELECT * FROM transactions
      WHERE id = ?;
      `,
      [id]
    );
    if (rows.length === 0) return null;
    return rows[0];
  } catch (error) {
    console.error('getTransactionById 에러', error);
    throw error;
  }
}
// 내역 수정
export async function updateTransaction(t: Transaction): Promise<void> {
  if (!t.id) {
    throw new Error('updateTransaction: id가 없습니다.');
  }

  try {
    await db.runAsync(
      `
      UPDATE transactions
      SET date = ?, 
          amount = ?, 
          type = ?, 
          mainCategory = ?, 
          subCategory = ?, 
          paymentMethod = ?, 
          memo = ?
      WHERE id = ?;
      `,
      [
        t.date,
        t.amount,
        t.type,
        t.mainCategory,
        t.subCategory ?? null,
        t.paymentMethod,
        t.memo ?? null,
        t.id,
      ]
    );
  } catch (error) {
    console.error('updateTransaction 에러', error);
    throw error;
  }
}


