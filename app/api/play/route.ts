import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractUserId } from '@/lib/auth'
import { getTodayKST } from '@/lib/date-utils'
import { rollDice, judgeResult, updateStreakState } from '@/lib/game-logic'
import type { PlayResponse, StreakState } from '@/types'

export async function POST(request: Request) {
  const tossUserId = extractUserId(request)
  if (!tossUserId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const supabase = createServerClient()
  const today = getTodayKST()
  const now = new Date()

  // 사용자 UPSERT (처음 접속 시 자동 생성)
  const { data: user, error: userError } = await supabase
    .from('dice_users')
    .upsert(
      { toss_user_id: tossUserId, updated_at: now.toISOString() },
      { onConflict: 'toss_user_id' }
    )
    .select('id')
    .single()

  if (userError || !user) {
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
  }

  const newStreak = updateStreakState(baseStreak, result, now)

  // 스트릭 UPSERT
  const { data: streak, error: streakError } = await supabase
    .from('dice_streak_state')
    .upsert({ ...newStreak, user_id: user.id })
    .select('*')
    .single()

  if (streakError || !streak) {
    return NextResponse.json({ error: '스트릭 업데이트 중 오류가 발생했습니다.' }, { status: 500 })
  }

  const response: PlayResponse = { battle, streak }
  return NextResponse.json(response)
}
