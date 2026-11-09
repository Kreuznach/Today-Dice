import type { StreakState } from '@/types'

export type BattleOutcome = 'win' | 'lose' | 'draw'
type StreakTriple = Record<BattleOutcome, number>

/** 지난 날들의 최종 결과(오래된 순)로 현재 연속 기록과 역대 최고 연속 기록을 계산 */
export function streaksFromHistory(outcomes: BattleOutcome[]): {
  current: StreakTriple
  max: StreakTriple
} {
  const current: StreakTriple = { win: 0, lose: 0, draw: 0 }
  const max: StreakTriple = { win: 0, lose: 0, draw: 0 }
  let runType: BattleOutcome | null = null
  let runLength = 0

  for (const outcome of outcomes) {
    runLength = outcome === runType ? runLength + 1 : 1
    runType = outcome
    if (runLength > max[outcome]) max[outcome] = runLength
  }

  if (runType) current[runType] = runLength
  return { current, max }
}

/** 1차 결과가 올려 둔 최고 기록만 되돌린다. 원래 더 높았던 기록은 그대로 둔다. */
export function rolledBackMax(
  storedMax: number,
  beforeCurrent: number,
  beforeMax: number,
  firstResultMatches: boolean,
): number {
  if (!firstResultMatches || storedMax > beforeCurrent + 1) return storedMax
  return Math.max(beforeMax, beforeCurrent)
}

/**
 * 1~6 사이의 랜덤 정수 반환 (서버에서만 호출)
 */
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1
}

/**
 * 주사위 숫자를 비교해 승패 판정
 */
export function judgeResult(
  userRoll: number,
  aiRoll: number
): 'win' | 'lose' | 'draw' {
  if (userRoll > aiRoll) return 'win'
  if (userRoll < aiRoll) return 'lose'
  return 'draw'
}

/**
 * 현재 스트릭 상태를 새 결과로 갱신한 상태를 반환.
 * - userRoll 을 넘기면 "같은 번호 연속(same_num_streak)" 및 숫자별 횟수(roll_count_X)도 함께 갱신.
 * - today(YYYY-MM-DD) 를 넘기면 연속 출석(attendance_streak)을 갱신.
 * - 무승부는 연승/연패를 초기화하고 무승부 스트릭을 증가.
 */
export function updateStreakState(
  current: StreakState,
  result: 'win' | 'lose' | 'draw',
  now: Date = new Date(),
  userRoll?: number,
  today?: string,
): StreakState {
  const next: StreakState = { ...current }

  if (result === 'win') {
    next.current_win_streak = current.current_win_streak + 1
    next.current_lose_streak = 0
    next.current_draw_streak = 0
    next.total_wins = current.total_wins + 1
    if (next.current_win_streak > current.max_win_streak) {
      next.max_win_streak = next.current_win_streak
      next.last_streak_achieved_at = now.toISOString()
    }
  } else if (result === 'lose') {
    next.current_win_streak = 0
    next.current_lose_streak = current.current_lose_streak + 1
    next.current_draw_streak = 0
    next.total_losses = current.total_losses + 1
    if (next.current_lose_streak > current.max_lose_streak) {
      next.max_lose_streak = next.current_lose_streak
    }
  } else {
    next.current_win_streak = 0
    next.current_lose_streak = 0
    next.current_draw_streak = current.current_draw_streak + 1
    next.total_draws = current.total_draws + 1
    if (next.current_draw_streak > current.max_draw_streak) {
      next.max_draw_streak = next.current_draw_streak
    }
  }

  // 같은 번호 연속 추적 + 숫자별 횟수 (userRoll 이 제공된 경우에만)
  if (userRoll !== undefined && userRoll >= 1 && userRoll <= 6) {
    const prevRoll = current.last_user_roll ?? null
    if (prevRoll !== null && userRoll === prevRoll) {
      next.current_same_num_streak = (current.current_same_num_streak ?? 0) + 1
    } else {
      next.current_same_num_streak = 1
    }
    if (next.current_same_num_streak > (current.max_same_num_streak ?? 0)) {
      next.max_same_num_streak = next.current_same_num_streak
    }
    next.last_user_roll = userRoll

    // 숫자별 나온 횟수 갱신
    const key = `roll_count_${userRoll}` as keyof StreakState
    next[key] = ((current[key] as number) ?? 0) + 1 as never
  }

  // 연속 출석 추적 (today 가 제공된 경우에만)
  if (today) {
    const lastPlay = current.last_play_date ?? null
    if (lastPlay) {
      const diffMs = new Date(today).getTime() - new Date(lastPlay).getTime()
      const diffDays = Math.round(diffMs / 86400000)
      if (diffDays === 1) {
        next.current_attendance_streak = (current.current_attendance_streak ?? 0) + 1
      } else {
        next.current_attendance_streak = 1
      }
    } else {
      next.current_attendance_streak = 1
    }
    if (next.current_attendance_streak > (current.max_attendance_streak ?? 0)) {
      next.max_attendance_streak = next.current_attendance_streak
    }
    next.last_play_date = today
  }

  next.total_plays = current.total_plays + 1
  next.updated_at = now.toISOString()

  return next
}
