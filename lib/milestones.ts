import type { StreakState, TodayBattle } from '@/types'

export const ATTENDANCE_MILESTONES = [1, 3, 7, 14, 30, 100] as const

export type AttendanceMilestone = (typeof ATTENDANCE_MILESTONES)[number]

export interface NextMilestone {
  target: AttendanceMilestone
  remain: number
}

export interface RareEvent {
  key: string
  title: string
  detail: string
}

export const MILESTONE_LABEL: Record<AttendanceMilestone, string> = {
  1: '첫 굴림',
  3: '3일 출석',
  7: '일주일',
  14: '2주',
  30: '한 달',
  100: '100일',
}

export function getNextAttendanceMilestone(
  currentAttendance: number,
): NextMilestone | null {
  const target = ATTENDANCE_MILESTONES.find((item) => item > currentAttendance)
  if (!target) return null
  return { target, remain: target - currentAttendance }
}

export function isAttendanceMilestone(value: number): boolean {
  return (ATTENDANCE_MILESTONES as readonly number[]).includes(value)
}

export function getUnlockedAttendanceBadges(
  maxAttendance: number,
  totalPlays: number,
): AttendanceMilestone[] {
  return ATTENDANCE_MILESTONES.filter((item) => {
    if (item === 1) return totalPlays >= 1 || maxAttendance >= 1
    return maxAttendance >= item
  })
}

/** 능력치는 없고, 이름 앞에만 붙는 치장 */
export function getHonorific(
  maxAttendance: number,
  totalPlays: number,
): string | null {
  if (maxAttendance >= 30) return '자리 잡은'
  if (maxAttendance >= 7) return '매일 오는'
  if (maxAttendance >= 3) return '출근하는'
  if (totalPlays >= 1) return '첫 주사위'
  return null
}

export function detectRareEvents(
  battle: TodayBattle,
  streak: StreakState | null,
  isFinal = false,
): RareEvent[] {
  const userRoll = isFinal && battle.has_rematch
    ? battle.rematch_user_roll
    : battle.user_roll
  const aiRoll = isFinal && battle.has_rematch
    ? battle.rematch_ai_roll
    : battle.ai_roll
  const events: RareEvent[] = []

  if (userRoll != null && aiRoll != null && userRoll === aiRoll) {
    events.push({
      key: 'double',
      title: '거울의 날',
      detail: `나와 AI가 둘 다 ${userRoll}이 나왔어요.`,
    })
  }

  if (
    (userRoll === 1 && aiRoll === 6) ||
    (userRoll === 6 && aiRoll === 1)
  ) {
    events.push({
      key: 'extreme',
      title: '최대 격차',
      detail: `${userRoll} 대 ${aiRoll}. 오늘 차이는 가장 커요.`,
    })
  }

  const sameNum = streak?.current_same_num_streak ?? 0
  if (userRoll != null && sameNum >= 3) {
    events.push({
      key: 'same_num',
      title: `${sameNum}일째 ${userRoll}`,
      detail: '같은 숫자가 이어지고 있어요.',
    })
  }

  if (userRoll === 6 && (streak?.roll_count_6 ?? 0) === 1) {
    events.push({
      key: 'first_six',
      title: '첫 6',
      detail: '처음으로 가장 큰 눈을 만났어요.',
    })
  }

  if (userRoll === 1 && (streak?.roll_count_1 ?? 0) === 1) {
    events.push({
      key: 'first_one',
      title: '첫 1',
      detail: '처음으로 가장 작은 눈을 만났어요.',
    })
  }

  if (
    isFinal &&
    battle.has_rematch &&
    battle.result === 'lose' &&
    battle.final_result === 'win'
  ) {
    events.push({
      key: 'comeback',
      title: '역전 기록',
      detail: '한 번 더 굴려서 오늘이 승리로 바뀌었어요.',
    })
  }

  return events
}

export function getTomorrowHint(
  playedToday: boolean,
  streak: StreakState | null,
): string | null {
  if (!streak) {
    return playedToday
      ? '내일 다시 오면 기록이 이어져요.'
      : '오늘 굴리면 내일이 더 쉬워져요.'
  }

  const attendance = streak.current_attendance_streak ?? 0
  const winStreak = streak.current_win_streak

  if (playedToday) {
    if (winStreak > 0) {
      return `내일 이기면 연승 ${winStreak + 1}이 돼요.`
    }
    if (attendance > 0) {
      return `내일이면 ${attendance + 1}일 연속이 됩니다.`
    }
    return '내일 다시 만나요.'
  }

  if (attendance > 0) {
    return `오늘 오면 ${attendance + 1}일 연속이 됩니다.`
  }
  return '오늘 오면 연속 출석이 시작돼요.'
}
