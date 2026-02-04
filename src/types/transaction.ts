// src/types/transaction.ts
export type TransactionType = 'expense' | 'income';

export const MAIN_CATEGORIES = [
  '식비',
  '주거/관리비',
  '교통/차량',
  '생활용품',
  '육아/교육',
  '의료/건강',
  '문화/여가',
  '금융/보험',
  '기타',
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number] | string;

export const PAYMENT_METHODS = [
  '현금',
  '체크카드',
  '신용카드',
  '전월정산',
  '계좌이체',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
