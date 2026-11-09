/**
 * lib/supabase.ts
 *
 * Supabase 클라이언트 및 데이터 접근 레이어
 *
 * Today-RPS 구조를 참고하여 클라이언트에서 Supabase에 직접 접근합니다.
 * Next.js API Route 또는 Edge Function 프록시 없이 동작합니다.
 */

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { addDaysToDateStr, getTodayKST, weekdayOfDateStr } from './date-utils'
import { generateNickname } from './nickname'
import { rollDice, judgeResult, updateStreakState, streaksFromHistory, rolledBackMax } from './game-logic'
import type { BattleOutcome } from './game-logic'
import type { Database } from '@/types/database'
import type {
  TodayStatusResponse,
  PlayResponse,
  RematchResponse,
  StreakState,
  RankingResponse,
  MyRecordsResponse,
} from '@/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

let _client: SupabaseClient<Database> | null = null

export function getClient(): SupabaseClient<Database> {
  if (!_client) {
    _client = createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return _client
}

// ─────────────────────────────────────────
// 날짜 (KST 기준)
// ─────────────────────────────────────────
export { getTodayKST }

// ─────────────────────────────────────────
// 사용자 — 조회 또는 신규 생성
// ─────────────────────────────────────────
async function getOrCreateUser(tossUserId: string): Promise<{ id: string }> {
  const db = getClient()

  const { data: existing } = await db
    .from('dice_users')
    .select('id')
    .eq('toss_user_id', tossUserId)
    .maybeSingle()

  if (existing) return existing

  const { data, error } = await db
    .from('dice_users')
    .insert({ toss_user_id: tossUserId, display_name: generateNickname() })
    .select('id')
    .single()

  if (error || !data) throw new Error('사용자 생성 실패')
  return data
}

// ─────────────────────────────────────────
// 오늘 상태 조회
// ─────────────────────────────────────────
export async function getTodayStatus(tossUserId: string): Promise<TodayStatusResponse> {
  const db = getClient()
  const today = getTodayKST()

  const { data: user } = await db
    .from('dice_users')
    .select('id')
    .eq('toss_user_id', tossUserId)
    .maybeSingle()

  if (!user) {
    return { played: false, battle: null, streak: null, recentBattles: [] }
  }

  const weekStart = addDaysToDateStr(today, -weekdayOfDateStr(today))

  const [battleRes, streakRes, weekRes] = await Promise.all([
    db
      .from('dice_daily_battle')
      .select('*')
      .eq('user_id', user.id)
      .eq('battle_date', today)
      .maybeSingle(),
    db
      .from('dice_streak_state')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    db
      .from('dice_daily_battle')
      .select('*')
      .eq('user_id', user.id)
      .gte('battle_date', weekStart)
      .lte('battle_date', today)
      .order('battle_date', { ascending: true }),
  ])

  return {
    played: !!battleRes.data,
    battle: battleRes.data ?? null,
    streak: streakRes.data ?? null,
    recentBattles: weekRes.data ?? [],
  }
}

// ─────────────────────────────────────────
// 플레이 (하루 1회)
// ─────────────────────────────────────────
export async function savePlay(tossUserId: string): Promise<PlayResponse> {
  const db = getClient()
  const today = getTodayKST()
  const now = new Date()

  const user = await getOrCreateUser(tossUserId)

  // 중복 체크
  const { data: existing } = await db
    .from('dice_daily_battle')
    .select('id')
    .eq('user_id', user.id)
    .eq('battle_date', today)
    .maybeSingle()

  if (existing) {
    throw Object.assign(new Error('오늘은 이미 플레이했어요. 내일 다시 도전하세요!'), { status: 409 })
  }

  const userRoll = rollDice()
  const aiRoll = rollDice()
  const result = judgeResult(userRoll, aiRoll)

  const { data: battle, error: battleError } = await db
    .from('dice_daily_battle')
    .insert({
      user_id: user.id,
      battle_date: today,
      user_roll: userRoll,
      ai_roll: aiRoll,
      result,
      final_result: result,
      has_rematch: false,
    })
    .select('*')
    .single()

  if (battleError || !battle) throw new Error('결과 저장 중 오류가 발생했습니다.')

  const { data: currentStreak } = await db
    .from('dice_streak_state')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const baseStreak: StreakState = currentStreak ?? defaultStreak(user.id, now)
  const newStreak = updateStreakState(baseStreak, result, now, userRoll, today)

  const streak = await upsertStreak(db, user.id, newStreak)

  return { battle, streak }
}

// ─────────────────────────────────────────
// 재대결
// ─────────────────────────────────────────
export async function saveRematch(tossUserId: string): Promise<RematchResponse> {
  const db = getClient()
  const today = getTodayKST()
  const now = new Date()

  const { data: user } = await db
    .from('dice_users')
    .select('id')
    .eq('toss_user_id', tossUserId)
    .maybeSingle()

  if (!user) throw new Error('사용자를 찾을 수 없습니다.')

  const { data: battle } = await db
    .from('dice_daily_battle')
    .select('*')
    .eq('user_id', user.id)
    .eq('battle_date', today)
    .maybeSingle()

  if (!battle) throw new Error('오늘 아직 플레이하지 않았습니다.')
  if (battle.has_rematch) {
    throw Object.assign(new Error('오늘 재대결은 이미 완료했습니다.'), { status: 409 })
  }

  const userRoll = rollDice()
  const aiRoll = rollDice()
  const rematchResult = judgeResult(userRoll, aiRoll)

  const { data: updatedBattle, error: updateError } = await db
    .from('dice_daily_battle')
    .update({
      has_rematch: true,
      rematch_user_roll: userRoll,
      rematch_ai_roll: aiRoll,
      rematch_result: rematchResult,
      final_result: rematchResult,
      rematched_at: now.toISOString(),
    })
    .eq('id', battle.id)
    .select('*')
    .single()

  if (updateError || !updatedBattle) throw new Error('재대결 결과 저장 중 오류가 발생했습니다.')

  const { data: currentStreak } = await db
    .from('dice_streak_state')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // 오늘 이전 기록으로 "1차 굴림 전" 연승/연패/무승부를 다시 계산 (1차에서 0으로 지워진 연승 복구)
  const { data: pastRows } = await db
    .from('dice_daily_battle')
    .select('final_result')
    .eq('user_id', user.id)
    .lt('battle_date', today)
    .order('battle_date', { ascending: true })
  const before = streaksFromHistory(
    (pastRows ?? []).map((row) => row.final_result as BattleOutcome),
  )

  // 1차 플레이 결과를 롤백한 기반 스트릭에서 재대결 결과 적용
  const base: StreakState = currentStreak
    ? {
        ...currentStreak,
        current_win_streak: before.current.win,
        current_lose_streak: before.current.lose,
        current_draw_streak: before.current.draw,
        max_win_streak: rolledBackMax(
          currentStreak.max_win_streak, before.current.win, before.max.win, battle.result === 'win',
        ),
        max_lose_streak: rolledBackMax(
          currentStreak.max_lose_streak, before.current.lose, before.max.lose, battle.result === 'lose',
        ),
        max_draw_streak: rolledBackMax(
          currentStreak.max_draw_streak, before.current.draw, before.max.draw, battle.result === 'draw',
        ),
        total_wins:
          battle.result === 'win' ? Math.max(0, currentStreak.total_wins - 1) : currentStreak.total_wins,
        total_losses:
          battle.result === 'lose' ? Math.max(0, currentStreak.total_losses - 1) : currentStreak.total_losses,
        total_draws:
          battle.result === 'draw' ? Math.max(0, currentStreak.total_draws - 1) : currentStreak.total_draws,
        total_plays: Math.max(0, currentStreak.total_plays - 1),
      }
    : defaultStreak(user.id, now)

  const newStreak = updateStreakState(base, rematchResult, now)
  if (rematchResult === 'win') newStreak.total_rematch_wins = (currentStreak?.total_rematch_wins ?? 0) + 1
  else if (rematchResult === 'draw') newStreak.total_rematch_draws = (currentStreak?.total_rematch_draws ?? 0) + 1
  else newStreak.total_rematch_losses = (currentStreak?.total_rematch_losses ?? 0) + 1

  const streak = await upsertStreak(db, user.id, newStreak)

  return { battle: updatedBattle, streak }
}

// ─────────────────────────────────────────
// 랭킹
// ─────────────────────────────────────────

const CATEGORY_COLUMN: Record<string, string> = {
  win_streak:      'max_win_streak',
  lose_streak:     'max_lose_streak',
  draw_streak:     'max_draw_streak',
  same_num_streak: 'max_same_num_streak',
  rematch_win:     'total_rematch_wins',
  rematch_loss:    'total_rematch_losses',
}

export async function getRanking(rawCategory: string, tossUserId: string | null): Promise<RankingResponse> {
  const db = getClient()
  const category = rawCategory in CATEGORY_COLUMN ? rawCategory : 'win_streak'
  const column = CATEGORY_COLUMN[category]

  const { data: topRows, error } = await db
    .from('dice_streak_state')
    .select(
      `user_id, max_win_streak, max_lose_streak, max_draw_streak,
      max_same_num_streak, total_rematch_wins, total_rematch_losses,
      last_streak_achieved_at, updated_at, dice_users!inner(display_name)`
    )
    .order(column, { ascending: false })
    .gt(column, 0)
    .limit(10)

  if (error) throw new Error('랭킹 조회 중 오류가 발생했습니다.')

  let myRank: number | null = null
  let myScore: number | null = null
  let myUserId: string | null = null

  if (tossUserId) {
    const { data: myUser } = await db
      .from('dice_users')
      .select('id')
      .eq('toss_user_id', tossUserId)
      .maybeSingle()

    if (myUser) {
      myUserId = myUser.id
      const { data: myRow } = await db
        .from('dice_streak_state')
        .select(column)
        .eq('user_id', myUser.id)
        .maybeSingle()

      if (myRow) {
        myScore = ((myRow as unknown) as Record<string, number>)[column] ?? null
        if (myScore !== null && myScore > 0) {
          const { count } = await db
            .from('dice_streak_state')
            .select('*', { count: 'exact', head: true })
            .gt(column, myScore)
          myRank = (count ?? 0) + 1
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (topRows ?? []) as any[]
  const updatedAt = rows[0]?.updated_at ?? null

  const entries = rows.map((row, idx) => {
    const users = row.dice_users as { display_name: string } | null
    const score = (row[column] as number) ?? 0
    return {
      rank: idx + 1,
      display_name: users?.display_name ?? '알 수 없음',
      score,
      achieved_at: row.last_streak_achieved_at ?? row.updated_at,
      is_me: myUserId !== null && row.user_id === myUserId,
    }
  })

  return { category, entries, my_rank: myRank, my_score: myScore, updated_at: updatedAt }
}

// ─────────────────────────────────────────
// 내 기록
// ─────────────────────────────────────────
export async function getMyRecords(tossUserId: string): Promise<MyRecordsResponse> {
  const db = getClient()
  const today = getTodayKST()

  const { data: user } = await db
    .from('dice_users')
    .select('id, display_name')
    .eq('toss_user_id', tossUserId)
    .maybeSingle()

  if (!user) {
    return { display_name: null, battles: [], streak: null }
  }

  const fromDate = addDaysToDateStr(today, -29)

  const [battlesRes, streakRes] = await Promise.all([
    db
      .from('dice_daily_battle')
      .select('*')
      .eq('user_id', user.id)
      .gte('battle_date', fromDate)
      .lte('battle_date', today)
      .order('battle_date', { ascending: false }),
    db.from('dice_streak_state').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  return {
    display_name: user.display_name ?? null,
    battles: battlesRes.data ?? [],
    streak: streakRes.data ?? null,
  }
}

// ─────────────────────────────────────────
// 내부 헬퍼
// ─────────────────────────────────────────
function defaultStreak(userId: string, now: Date): StreakState {
  return {
    user_id: userId,
    current_win_streak: 0,
    current_lose_streak: 0,
    current_draw_streak: 0,
    max_win_streak: 0,
    max_lose_streak: 0,
    max_draw_streak: 0,
    total_wins: 0,
    total_losses: 0,
    total_draws: 0,
    total_plays: 0,
    last_streak_achieved_at: null,
    updated_at: now.toISOString(),
    current_same_num_streak: 0,
    max_same_num_streak: 0,
    last_user_roll: null,
    total_rematch_wins: 0,
    total_rematch_losses: 0,
    total_rematch_draws: 0,
    roll_count_1: 0,
    roll_count_2: 0,
    roll_count_3: 0,
    roll_count_4: 0,
    roll_count_5: 0,
    roll_count_6: 0,
    current_attendance_streak: 0,
    max_attendance_streak: 0,
    last_play_date: null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertStreak(db: SupabaseClient<Database>, userId: string, newStreak: StreakState): Promise<StreakState> {
  const {
    current_same_num_streak,
    max_same_num_streak,
    last_user_roll,
    total_rematch_wins,
    total_rematch_losses,
    total_rematch_draws,
    roll_count_1, roll_count_2, roll_count_3,
    roll_count_4, roll_count_5, roll_count_6,
    current_attendance_streak,
    max_attendance_streak,
    last_play_date,
    ...baseStreakFields
  } = newStreak

  const { data: streak, error } = await db
    .from('dice_streak_state')
    .upsert({ ...baseStreakFields, user_id: userId })
    .select('*')
    .single()

  if (error || !streak) throw new Error('스트릭 업데이트 중 오류가 발생했습니다.')

  // migration 006+007 컬럼 업데이트 (컬럼 없으면 에러 무시)
  await db
    .from('dice_streak_state')
    .update({
      current_same_num_streak: current_same_num_streak ?? 0,
      max_same_num_streak: max_same_num_streak ?? 0,
      last_user_roll: last_user_roll ?? null,
      total_rematch_wins: total_rematch_wins ?? 0,
      total_rematch_losses: total_rematch_losses ?? 0,
      total_rematch_draws: total_rematch_draws ?? 0,
      roll_count_1: roll_count_1 ?? 0,
      roll_count_2: roll_count_2 ?? 0,
      roll_count_3: roll_count_3 ?? 0,
      roll_count_4: roll_count_4 ?? 0,
      roll_count_5: roll_count_5 ?? 0,
      roll_count_6: roll_count_6 ?? 0,
      current_attendance_streak: current_attendance_streak ?? 0,
      max_attendance_streak: max_attendance_streak ?? 0,
      last_play_date: last_play_date ?? null,
    })
    .eq('user_id', userId)

  return streak as StreakState
}
