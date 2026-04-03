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
}

// ─── API 응답 타입 ────────────────────────────────────────────────────────────

export interface TodayStatusResponse {
  played: boolean
  battle: TodayBattle | null
  streak: StreakState | null
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
  battles: TodayBattle[]
  streak: StreakState | null
}
