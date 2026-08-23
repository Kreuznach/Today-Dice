// ─── DB 기반 타입 ────────────────────────────────────────────────────────────

export interface DiceUser {
  id: string
  toss_user_id: string
  display_name: string
  created_at: string
  updated_at: string
}

export interface TodayBattle {
  id: string
  user_id: string
  battle_date: string
  user_roll: number
  ai_roll: number
  result: 'win' | 'lose' | 'draw'
  has_rematch: boolean
  rematch_user_roll: number | null
  rematch_ai_roll: number | null
  rematch_result: 'win' | 'lose' | 'draw' | null
  final_result: 'win' | 'lose' | 'draw'
  created_at: string
  rematched_at: string | null
}

export interface StreakState {
  user_id?: string
  current_win_streak: number
  current_lose_streak: number
  current_draw_streak: number
  max_win_streak: number
  max_lose_streak: number
  max_draw_streak: number
  total_wins: number
  total_losses: number
  total_draws: number
  total_plays: number
  last_streak_achieved_at: string | null
  updated_at: string
  // 같은 번호 연속 추적
  current_same_num_streak: number
  max_same_num_streak: number
  last_user_roll: number | null
  // 역전승/역전패/무승부 누적
  total_rematch_wins: number
  total_rematch_losses: number
  total_rematch_draws: number
  // 주사위 숫자별 나온 횟수 (초기 플레이 기준)
  roll_count_1: number
  roll_count_2: number
  roll_count_3: number
  roll_count_4: number
  roll_count_5: number
  roll_count_6: number
  // 연속 출석
  current_attendance_streak: number
  max_attendance_streak: number
  last_play_date: string | null
}

// ─── API 응답 타입 ────────────────────────────────────────────────────────────

export interface TodayStatusResponse {
  played: boolean
  battle: TodayBattle | null
  streak: StreakState | null
  recentBattles: TodayBattle[]
}

export interface PlayResponse {
  battle: TodayBattle
  streak: StreakState
}

export interface RematchResponse {
  battle: TodayBattle
  streak: StreakState
}

export interface RankingEntry {
  rank: number
  display_name: string
  score: number
  achieved_at: string
  is_me: boolean
}

export interface RankingResponse {
  category: string
  entries: RankingEntry[]
  my_rank: number | null
  my_score: number | null
  updated_at: string | null
}

export interface MyRecordsResponse {
  display_name: string | null
  battles: TodayBattle[]
  streak: StreakState | null
}
