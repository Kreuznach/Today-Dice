import type { StreakState } from '@/types'

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
 * - userRoll 을 넘기면 "같은 번호 연속(same_num_streak)" 도 함께 갱신.
 * - 무승부는 연승/연패를 초기화하고 무승부 스트릭을 증가.
 */
export function updateStreakState(
  current: StreakState,
  result: 'win' | 'lose' | 'draw',
  now: Date = new Date(),
  userRoll?: number,
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

  // 같은 번호 연속 추적 (userRoll 이 제공된 경우에만)
  if (userRoll !== undefined) {
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
  }

  next.total_plays = current.total_plays + 1
  next.updated_at = now.toISOString()

  return next
}
