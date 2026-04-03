/**
 * KST(UTC+9) 기준 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환
 */
export function getTodayKST(): string {
  const now = new Date()
  // KST = UTC + 9시간
  const kstOffset = 9 * 60 * 60 * 1000
  const kstDate = new Date(now.getTime() + kstOffset)
  return kstDate.toISOString().slice(0, 10)
}
