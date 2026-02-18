// src/db/database.ts
import * as SQLite from 'expo-sqlite';
import {
  DB_NAME,
  CREATE_TRANSACTIONS_TABLE,
  CREATE_CATEGORIES_TABLE,
  CREATE_BUDGETS_TABLE,
} from './schema';
import {
  MAIN_CATEGORIES,
  MainCategory,
  PaymentMethod,
  TransactionType,
} from '../types/transaction';

export type Transaction = {
  id?: number;
  date: string; // '2026-02-03'
  amount: number;
  type: TransactionType;
  mainCategory: MainCategory;
  subCategory?: string;
  paymentMethod: PaymentMethod;
  memo?: string;
  createdAt: string; // new Date().toISOString()
};

export type Budget = {
  id?: number;
  year: number;
  month: number;
  mainCategory: string | null; // null => 전체 예산
  amount: number;
  createdAt: string;
};

/** SQLite DB 핸들 (동기 방식으로 열기) */
const db = SQLite.openDatabaseSync(DB_NAME);

/**
 * 앱 시작 시 테이블 생성 및 기본 카테고리 시딩
 * - transactions, categories, budgets 테이블 생성
 * - MAIN_CATEGORIES 배열의 기본 카테고리를 INSERT OR IGNORE
 */
export async function initDatabase(): Promise<void> {
  await db.execAsync(CREATE_TRANSACTIONS_TABLE);
  await db.execAsync(CREATE_CATEGORIES_TABLE);
  await db.execAsync(CREATE_BUDGETS_TABLE);

  for (const name of MAIN_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (name, isDefault, createdAt) VALUES (?, 1, ?);`,
      [name, new Date().toISOString()],
    );
  }
}

/**
 * 거래 내역 한 건 추가
 * @param t - id를 제외한 Transaction 객체
 */
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
      ],
    );
  } catch (error) {
    console.error('insertTransaction 에러', error);
    throw error;
  }
}

/**
 * 전체 거래 내역 조회 (최신순 정렬)
 * @returns Transaction 배열
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    const rows = await db.getAllAsync<Transaction>(
      `
      SELECT * FROM transactions
      ORDER BY date DESC, createdAt DESC;
      `,
      [],
    );
    // getAllAsync는 이미 배열을 반환하므로 바로 리턴[web:130][web:167]
    return rows;
  } catch (error) {
    console.error('getAllTransactions 에러', error);
    throw error;
  }
}

/** 월별 요약 타입 */
export type MonthlySummary = {
  totalIncome: number;
  totalExpense: number;
  byCategory: { mainCategory: string; amount: number }[];
};

/**
 * 특정 월의 총 지출 + 카테고리별 합계 조회
 * @param year  - 연도 (e.g. 2026)
 * @param month - 월 1~12
 * @returns 총 지출액과 카테고리별 금액 배열
 */
export async function getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
  const monthStr = month.toString().padStart(2, '0');
  const prefix = `${year}-${monthStr}`; // 예: 2026-02

  try {
    // 총 수입
    const incomeRows = await db.getAllAsync<{ total: number }>(
      `
        SELECT SUM(amount) as total
        FROM transactions
        WHERE type = 'income'
          AND date LIKE ?;
        `,
      [`${prefix}%`],
    );
    const totalIncome = incomeRows[0]?.total ?? 0;

    // 총 지출
    const totalRows = await db.getAllAsync<{ total: number }>(
      `
        SELECT SUM(amount) as total
        FROM transactions
        WHERE type = 'expense'
          AND date LIKE ?;
        `,
      [`${prefix}%`],
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
      [`${prefix}%`],
    );

    return {
      totalIncome,
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

/**
 * 특정 월의 카테고리별 지출 합계 (내림차순)
 * @param year  - 연도
 * @param month - 월 1~12
 * @returns 카테고리명 + 금액 배열
 */
export async function getCategorySummary(
  year: number,
  month: number,
): Promise<CategorySummaryRow[]> {
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
      [`${prefix}%`],
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

/**
 * 특정 월의 결제수단별 지출 합계 (내림차순)
 * @param year  - 연도
 * @param month - 월 1~12
 * @returns 결제수단명 + 금액 배열
 */
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
      [`${prefix}%`],
    );
    return rows;
  } catch (error) {
    console.error('getPaymentSummary 에러', error);
    throw error;
  }
}

/**
 * 거래 내역 한 건 삭제
 * @param id - 삭제할 거래 ID
 */
export async function deleteTransactionById(id: number): Promise<void> {
  try {
    await db.runAsync(
      `
        DELETE FROM transactions
        WHERE id = ?;
        `,
      [id],
    );
  } catch (error) {
    console.error('deleteTransactionById 에러', error);
    throw error;
  }
}

/**
 * 거래 내역 단건 조회
 * @param id - 조회할 거래 ID
 * @returns Transaction 또는 null (없을 경우)
 */
export async function getTransactionById(id: number): Promise<Transaction | null> {
  try {
    const rows = await db.getAllAsync<Transaction>(
      `
      SELECT * FROM transactions
      WHERE id = ?;
      `,
      [id],
    );
    if (rows.length === 0) return null;
    return rows[0];
  } catch (error) {
    console.error('getTransactionById 에러', error);
    throw error;
  }
}
/**
 * 거래 내역 수정 (id 필수)
 * @param t - 수정할 Transaction 객체 (id 포함)
 * @throws id가 없으면 Error
 */
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
      ],
    );
  } catch (error) {
    console.error('updateTransaction 에러', error);
    throw error;
  }
}

export type Category = { id: number; name: string; isDefault: number };

/**
 * 전체 카테고리 목록 조회 (기본 카테고리 우선, 생성순)
 * @returns Category 배열
 */
export async function getCategories(): Promise<Category[]> {
  return db.getAllAsync<Category>(
    `SELECT id, name, isDefault FROM categories ORDER BY isDefault DESC, createdAt ASC;`,
    [],
  );
}

/**
 * 사용자 정의 카테고리 추가
 * @param name - 카테고리명
 */
export async function addCategory(name: string): Promise<void> {
  await db.runAsync(`INSERT INTO categories (name, createdAt) VALUES (?, ?);`, [
    name,
    new Date().toISOString(),
  ]);
}

/**
 * 카테고리 삭제
 * @param id - 삭제할 카테고리 ID
 */
export async function deleteCategory(id: number): Promise<void> {
  await db.runAsync(`DELETE FROM categories WHERE id = ?;`, [id]);
}

/**
 * 특정 월의 최근 지출 내역 (최신순, 개수 제한)
 * @param year  - 연도
 * @param month - 월 1~12
 * @param limit - 최대 조회 건수
 * @returns Transaction 배열
 */
export async function getRecentTransactionsOfMonth(
  year: number,
  month: number,
  limit: number,
): Promise<Transaction[]> {
  const monthStr = month.toString().padStart(2, '0');
  const prefix = `${year}-${monthStr}`; // 예: 2026-02

  try {
    const rows = await db.getAllAsync<Transaction>(
      `
      SELECT
        id,
        date,
        amount,
        type,
        mainCategory,
        subCategory,
        paymentMethod,
        memo,
        createdAt
      FROM transactions
      WHERE type = 'expense'
        AND date LIKE ?
      ORDER BY date DESC, createdAt DESC
      LIMIT ?;
      `,
      [`${prefix}%`, limit],
    );
    return rows;
  } catch (error) {
    console.error('getRecentTransactionsOfMonth 에러', error);
    throw error;
  }
}

/**
 * 특정 날짜의 지출 합계
 * @param dateString - 날짜 문자열 (e.g. '2026-02-03')
 * @returns 합계 금액 (없으면 0)
 */
export async function getTodayExpenseTotal(dateString: string): Promise<number> {
  try {
    const rows = await db.getAllAsync<{ total: number }>(
      `
      SELECT SUM(amount) as total
      FROM transactions
      WHERE type = 'expense'
        AND date = ?;
      `,
      [dateString],
    );
    return rows[0]?.total ?? 0;
  } catch (error) {
    console.error('getTodayExpenseTotal 에러', error);
    throw error;
  }
}

export type DailySummaryRow = {
  date: string; // '2026-02-03'
  income: number; // 그날 수입 합계
  expense: number; // 그날 지출 합계;
};

/**
 * 특정 월의 일별 지출 합계 (날짜 오름차순)
 * @param year  - 연도
 * @param month - 월 1~12
 * @returns 날짜별 합계 배열
 */
export async function getDailySummaryOfMonth(
  year: number,
  month: number,
): Promise<DailySummaryRow[]> {
  const monthStr = month.toString().padStart(2, '0');
  const prefix = `${year}-${monthStr}`; // 2026-02

  try {
    const rows = await db.getAllAsync<DailySummaryRow>(
      `
      SELECT
        date,
        SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM transactions
      WHERE date LIKE ?
      GROUP BY date
      ORDER BY date ASC;
      `,
      [`${prefix}%`],
    );
    return rows;
  } catch (error) {
    console.error('getDailySummaryOfMonth 에러', error);
    throw error;
  }
}

/**
 * 특정 월의 전체 + 카테고리별 예산 목록 조회
 * @param year  - 연도
 * @param month - 월 1~12
 * @returns Budget 배열 (전체 예산이 먼저, 카테고리별 예산이 뒤에)
 */
export async function getBudgetsOfMonth(year: number, month: number): Promise<Budget[]> {
  try {
    const rows = await db.getAllAsync<Budget>(
      `
      SELECT id, year, month, mainCategory, amount, createdAt
      FROM budgets
      WHERE year = ? AND month = ?
      ORDER BY mainCategory IS NULL DESC, mainCategory ASC;
      `,
      [year, month],
    );
    return rows;
  } catch (error) {
    console.error('getBudgetsOfMonth 에러', error);
    throw error;
  }
}

/**
 * 특정 월의 전체 예산 금액만 조회
 * @param year  - 연도
 * @param month - 월 1~12
 * @returns 예산 금액 또는 null (설정 안 된 경우)
 */
export async function getTotalBudgetOfMonth(year: number, month: number): Promise<number | null> {
  try {
    const rows = await db.getAllAsync<{ amount: number }>(
      `
      SELECT amount
      FROM budgets
      WHERE year = ? AND month = ? AND mainCategory IS NULL
      LIMIT 1;
      `,
      [year, month],
    );
    return rows[0]?.amount ?? null;
  } catch (error) {
    console.error('getTotalBudgetOfMonth 에러', error);
    throw error;
  }
}

/**
 * 예산 저장 (없으면 INSERT, 있으면 UPDATE)
 * @param year         - 연도
 * @param month        - 월 1~12
 * @param mainCategory - 카테고리명 (null이면 전체 예산)
 * @param amount       - 예산 금액
 */
export async function upsertBudget(
  year: number,
  month: number,
  mainCategory: string | null,
  amount: number,
): Promise<void> {
  try {
    await db.runAsync(
      `
      INSERT INTO budgets (year, month, mainCategory, amount, createdAt)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(year, month, mainCategory)
      DO UPDATE SET amount = excluded.amount;
      `,
      [year, month, mainCategory, amount, new Date().toISOString()],
    );
  } catch (error) {
    console.error('upsertBudget 에러', error);
    throw error;
  }
}

/**
 * 예산 삭제
 * @param year         - 연도
 * @param month        - 월 1~12
 * @param mainCategory - 카테고리명 (null이면 전체 예산 삭제)
 */
export async function deleteBudget(
  year: number,
  month: number,
  mainCategory: string | null,
): Promise<void> {
  try {
    await db.runAsync(
      `
      DELETE FROM budgets
      WHERE year = ? AND month = ? AND
            (mainCategory IS ? OR mainCategory = ?);
      `,
      [year, month, mainCategory, mainCategory],
    );
  } catch (error) {
    console.error('deleteBudget 에러', error);
    throw error;
  }
}

export async function getTransactionsByDate(date: string): Promise<Transaction[]> {
  const rows = await db.getAllAsync<Transaction>(
    `
    SELECT id, date, amount, type, mainCategory, memo, createdAt
    FROM transactions
    WHERE date = ?
    ORDER BY createdAt DESC
    `,
    [date],
  );

  return rows;
}

export async function getMonthlyIncomeTotal(year: number, month: number): Promise<number> {
  const monthStr = month.toString().padStart(2, '0');
  const prefix = `${year}-${monthStr}`;

  const rows = await db.getAllAsync<{ total: number }>(
    `
    SELECT SUM(amount) as total
    FROM transactions
    WHERE type = 'income'
      AND date LIKE ?;
    `,
    [`${prefix}%`],
  );

  return rows[0]?.total ?? 0;
}
