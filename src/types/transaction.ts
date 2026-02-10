// src/types/transaction.ts
export type TransactionType = 'expense' | 'income';
export type MainCategory = string;
export type PaymentMethod = string;

// 지출 카테고리
export const EXPENSE_MAIN_CATEGORIES: MainCategory[] = [
  '식비',
  '주거/관리비',
  '교통/차량',
  '생활용품',
  '육아/교육',
  '의료/건강',
  '문화/여가',
  '금융/보험',
  '공과금',
  '기타',
] as const;

// 수입 카테고리
export const INCOME_MAIN_CATEGORIES: MainCategory[] = [
  '급여',
  '보너스',
  '용돈',
  '사업수입',
  '투자수익',
  '기타수입',
];

export const MAIN_CATEGORIES: MainCategory[] = [
  ...EXPENSE_MAIN_CATEGORIES,
  ...INCOME_MAIN_CATEGORIES,
];

export const EXPENSE_PAYMENT_METHODS: PaymentMethod[] = [
  '현금',
  '체크카드',
  '신용카드',
  '계좌이체',
];

export const INCOME_PAYMENT_METHODS: PaymentMethod[] = ['현금', '계좌입금', '이체', '기타'];

export const PAYMENT_METHODS: PaymentMethod[] = [
  ...EXPENSE_PAYMENT_METHODS,
  ...INCOME_PAYMENT_METHODS,
];
