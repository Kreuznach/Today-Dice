/** 한국 시간(KST, UTC+9)을 밀리초로 더한 Date */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

function toKstShifted(now: Date): Date {
  return new Date(now.getTime() + KST_OFFSET_MS)
}

/**
 * KST(UTC+9) 기준 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환
 */
export function getTodayKST(now: Date = new Date()): string {
  return toKstShifted(now).toISOString().slice(0, 10)
}

/** YYYY-MM-DD 문자열에 날짜를 더한다. */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/** YYYY-MM-DD 의 요일. 0=일요일 … 6=토요일 (KST 달력 기준) */
export function weekdayOfDateStr(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

/** 지금 시각의 KST 요일. 0=일요일 … 6=토요일 */
export function getWeekdayKST(now: Date = new Date()): number {
  return weekdayOfDateStr(getTodayKST(now))
}

/** 다음 KST 자정까지 남은 밀리초 */
export function getMsUntilNextMidnightKST(now: Date = new Date()): number {
  const kst = toKstShifted(now)
  const nextMidnight = Date.UTC(
    kst.getUTCFullYear(),
    kst.getUTCMonth(),
    kst.getUTCDate() + 1,
  )
  const currentAsUtc = Date.UTC(
    kst.getUTCFullYear(),
    kst.getUTCMonth(),
    kst.getUTCDate(),
    kst.getUTCHours(),
    kst.getUTCMinutes(),
    kst.getUTCSeconds(),
    kst.getUTCMilliseconds(),
  )
  return Math.max(0, nextMidnight - currentAsUtc)
}

/** 남은 시간을 HH:MM:SS 로 보여 준다. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = String(Math.floor(total / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const seconds = String(total % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/** 오늘이 들어 있는 주(일요일~토요일) 날짜 7개 */
export function getSundayWeekDates(today: string = getTodayKST()): string[] {
  const sundayOffset = weekdayOfDateStr(today)
  return Array.from({ length: 7 }, (_, index) =>
    addDaysToDateStr(today, index - sundayOffset),
  )
}

/** 오늘을 끝으로 최근 n일 날짜 목록 (오래된 날 → 오늘) */
export function getLastNDates(today: string = getTodayKST(), n = 30): string[] {
  return Array.from({ length: n }, (_, index) =>
    addDaysToDateStr(today, -(n - 1 - index)),
  )
}
