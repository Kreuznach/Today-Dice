import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractUserId } from '@/lib/auth'
import { getTodayKST } from '@/lib/date-utils'
import { rollDice, judgeResult, updateStreakState } from '@/lib/game-logic'
import { generateNickname } from '@/lib/nickname'
import type { PlayResponse, StreakState } from '@/types'

export async function POST(request: Request) {
  const tossUserId = extractUserId(request)
  if (!tossUserId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const supabase = createServerClient()
  const today = getTodayKST()
  const now = new Date()

  // 사용자 조회 — 없으면 신규 생성 (닉네임은 최초 1회만 생성)
  let { data: user } = await supabase
    .from('dice_users')
    .select('id')
    .eq('toss_user_id', tossUserId)
    .single()

  if (!user) {
    const { data: newUser, error: insertError } = await supabase
      .from('dice_users')
      .insert({
        toss_user_id: tossUserId,
        display_name: generateNickname(),
      })
      .select('id')
      .single()

    if (insertError || !newUser) {
      return NextResponse.json({ error: '사용자 처리 중 오류가 발생했습니다.' }, { status: 500 })
    }
    user = newUser
  }

  if (!user) {
    return NextResponse.json({ error: '사용자 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }

  // 하루 1회 중복 체크
  const { data: existing } = await supabase
    .from('dice_daily_battle')
    .select('id')
    .eq('user_id', user.id)
    .eq('battle_date', today)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: '오늘은 이미 플레이했어요. 내일 다시 도전하세요!' },
      { status: 409 }
    )
  }

  // AI 주사위는 서버에서만 생성
  const userRoll = rollDice()
  const aiRoll = rollDice()
  const result = judgeResult(userRoll, aiRoll)

  // 배틀 기록 저장
  const { data: battle, error: battleError } = await supabase
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

  if (battleError || !battle) {
    return NextResponse.json({ error: '결과 저장 중 오류가 발생했습니다.' }, { status: 500 })
  }

  // 스트릭 상태 조회
  const { data: currentStreak } = await supabase
    .from('dice_streak_state')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const baseStreak: StreakState = currentStreak ?? {
    user_id: user.id,
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

  const newStreak = updateStreakState(baseStreak, result, now, userRoll, today)

  // 기본 컬럼만 UPSERT (migration 006 적용 전 환경에서도 안전하게 동작)
  const {
    current_same_num_streak,
    max_same_num_streak,
    last_user_roll: lastUserRoll,
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

  const { data: streak, error: streakError } = await supabase
    .from('dice_streak_state')
    .upsert({ ...baseStreakFields, user_id: user.id })
    .select('*')
    .single()

  if (streakError || !streak) {
    return NextResponse.json({ error: '스트릭 업데이트 중 오류가 발생했습니다.' }, { status: 500 })
  }

  // migration 006+007 컬럼 업데이트 시도 — 컬럼이 없으면 에러를 무시
  await supabase
    .from('dice_streak_state')
    .update({
      current_same_num_streak: current_same_num_streak ?? 0,
      max_same_num_streak: max_same_num_streak ?? 0,
      last_user_roll: lastUserRoll ?? null,
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
    .eq('user_id', user.id)
  // 에러 무시 (migration 미적용 환경 대응)

  const response: PlayResponse = { battle, streak }
  return NextResponse.json(response)
}
