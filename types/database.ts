/**
 * Supabase 데이터베이스 스키마 타입 정의
 *
 * @supabase/supabase-js의 createClient<Database>에 전달하여
 * 쿼리 결과에 대한 TypeScript 타입 추론을 활성화합니다.
 */

export interface Database {
  public: {
    Tables: {
      dice_users: {
        Row: {
          id: string
          toss_user_id: string
          display_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          toss_user_id: string
          display_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          toss_user_id?: string
          display_name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      dice_daily_battle: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          battle_date: string
          user_roll: number
          ai_roll: number
          result: 'win' | 'lose' | 'draw'
          has_rematch?: boolean
          rematch_user_roll?: number | null
          rematch_ai_roll?: number | null
          rematch_result?: 'win' | 'lose' | 'draw' | null
          final_result: 'win' | 'lose' | 'draw'
          created_at?: string
          rematched_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          battle_date?: string
          user_roll?: number
          ai_roll?: number
          result?: 'win' | 'lose' | 'draw'
          has_rematch?: boolean
          rematch_user_roll?: number | null
          rematch_ai_roll?: number | null
          rematch_result?: 'win' | 'lose' | 'draw' | null
          final_result?: 'win' | 'lose' | 'draw'
          created_at?: string
          rematched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'dice_daily_battle_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'dice_users'
            referencedColumns: ['id']
          }
        ]
      }
      dice_streak_state: {
        Row: {
          user_id: string
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
          current_same_num_streak: number
          max_same_num_streak: number
          last_user_roll: number | null
          total_rematch_wins: number
          total_rematch_losses: number
          total_rematch_draws: number
          roll_count_1: number
          roll_count_2: number
          roll_count_3: number
          roll_count_4: number
          roll_count_5: number
          roll_count_6: number
          current_attendance_streak: number
          max_attendance_streak: number
          last_play_date: string | null
        }
        Insert: {
          user_id: string
          current_win_streak?: number
          current_lose_streak?: number
          current_draw_streak?: number
          max_win_streak?: number
          max_lose_streak?: number
          max_draw_streak?: number
          total_wins?: number
          total_losses?: number
          total_draws?: number
          total_plays?: number
          last_streak_achieved_at?: string | null
          updated_at?: string
          current_same_num_streak?: number
          max_same_num_streak?: number
          last_user_roll?: number | null
          total_rematch_wins?: number
          total_rematch_losses?: number
          total_rematch_draws?: number
          roll_count_1?: number
          roll_count_2?: number
          roll_count_3?: number
          roll_count_4?: number
          roll_count_5?: number
          roll_count_6?: number
          current_attendance_streak?: number
          max_attendance_streak?: number
          last_play_date?: string | null
        }
        Update: {
          user_id?: string
          current_win_streak?: number
          current_lose_streak?: number
          current_draw_streak?: number
          max_win_streak?: number
          max_lose_streak?: number
          max_draw_streak?: number
          total_wins?: number
          total_losses?: number
          total_draws?: number
          total_plays?: number
          last_streak_achieved_at?: string | null
          updated_at?: string
          current_same_num_streak?: number
          max_same_num_streak?: number
          last_user_roll?: number | null
          total_rematch_wins?: number
          total_rematch_losses?: number
          total_rematch_draws?: number
          roll_count_1?: number
          roll_count_2?: number
          roll_count_3?: number
          roll_count_4?: number
          roll_count_5?: number
          roll_count_6?: number
          current_attendance_streak?: number
          max_attendance_streak?: number
          last_play_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'dice_streak_state_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'dice_users'
            referencedColumns: ['id']
          }
        ]
      }
      dice_leaderboard_cache: {
        Row: {
          id: string
          category: string
          rank: number
          user_id: string
          score: number
          display_name: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          rank: number
          user_id: string
          score: number
          display_name: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          rank?: number
          user_id?: string
          score?: number
          display_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
