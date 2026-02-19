/**
 * 금액을 만 원 단위로 포맷
 * - 0이면 '0원'
 * - 1만 미만이면 원 단위 (e.g. '3,500원')
 * - 1만 이상이면 만 원 단위 (e.g. '130만 원')
 * @param amount - 금액 (숫자)
 * @returns 포맷된 금액 문자열
 */
export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount)) return '0원';
  const man = amount / 10000;
  if (man === 0) return '0원';

  if (Math.abs(amount) < 10000) {
    return `${amount.toLocaleString()}원`;
  }

  const manRounded = Math.round(man);
  return `${manRounded.toLocaleString()}만 원`;
}

/**
 * 숫자에 콤마를 찍어서 '원' 붙이기
 * - e.g. 1500000 → '1,500,000원'
 * @param amount - 금액 (숫자)
 * @returns 포맷된 금액 문자열
 */
export function formatWon(amount: number): string {
  if (!Number.isFinite(amount)) return '0원';
  return `${amount.toLocaleString()}원`;
}
