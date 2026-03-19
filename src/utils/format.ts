/**
 * 금액을 만 원 단위로 포맷
 * - 0이면 '0원'
 * - 1만 미만이면 원 단위 (e.g. '3,500원')
 * - 1만 이상이면 만 원 단위 (e.g. '130만 원')
 * @param amount - 금액 (숫자)
 * @returns 포맷된 금액 문자열
 */
export function formatAmount(amount: number): string {
  return formatWon(amount);
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

/**
 * 차트 레이블용 압축 금액 포맷
 * - 1만 미만: 원 단위 (e.g. '9,999원')
 * - 1만 이상: 만원 단위, 소수점 1자리 (e.g. '1.5만원', '50만원')
 */
export function formatChartAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return '0원';
  if (amount < 10000) return `${amount.toLocaleString()}원`;
  const man = Math.round((amount / 10000) * 10) / 10;
  return `${man}만원`;
}
