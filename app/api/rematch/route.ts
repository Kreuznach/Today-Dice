import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractUserId } from '@/lib/auth'
import { getTodayKST } from '@/lib/date-utils'
import { rollDice, judgeResult, updateStreakState } from '@/lib/game-logic'
import type { RematchResponse, StreakState } from '@/types'

export async function POST(request: Request) {
  const tossUserId = extractUserId(request)
  if (!tossUserId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  let body: { ad_token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  // MVP: ad_token 기본 검증 (존재 여부만 확인)
  if (!body.ad_token) {
    return NextResponse.json({ error: '광고 토큰이 없습니다.' }, { status: 400 })
  }

  const supabase = createServerClient()
  const today = getTodayKST()
  const now = new Date()

  // 사용자 조회
  const { data: user } = await supabase
    .from('dice_users')
    .select('id')
    .eq('toss_user_id', tossUserId)
    .single()

  if (!user) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 400 })
  }

  // 오늘 배틀 기록 확인
  const { data: battle } = await supabase
    .from('dice_daily_battle')
    .select('*')
    .eq('user_id', user.id)
    .eq('battle_date', today)
    .single()

  if (!battle) {
    return NextResponse.json(
      { error: '오늘 아직 플레이하지 않았습니다. 먼저 주사위를 굴려주세요.' },
      { status: 400 }
    )
  }

  if (battle.has_rematch) {
    return NextResponse.json(
      { error: '오늘 재대결은 이미 완료했습니다.' },
      { status: 409 }
    )
  }

  // 재대결: AI 주사위 서버에서 생성
  const userRoll = rollDice()
  const aiRoll = rollDice()
  const rematchResult = judgeResult(userRoll, aiRoll)

  // 배틀 기록 업데이트
  const { data: updatedBattle, error: updateError } = await supabase
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

  if (updateError || !updatedBattle) {
    return NextResponse.json({ error: '재대결 결과 저장 중 오류가 발생했습니다.' }, { status: 500 })
  }

  // 스트릭: 재대결 결과로 덮어씀
  const { data: currentStreak } = await supabase
    .from('dice_streak_state')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // 1차 결과로 증가된 total_plays를 되돌린 후 재대결 결과 적용
  const baseForRematch: StreakState = currentStreak
    ? {
        ...currentStreak,
        // 1차 플레이로 증가된 수치를 롤백
        current_win_streak:
          battle.result === 'win' ? Math.max(0, currentStreak.current_win_streak - 1) : currentStreak.current_win_streak,
        current_lose_streak:
          battle.result === 'lose' ? Math.max(0, currentStreak.current_lose_streak - 1) : currentStreak.current_lose_streak,
        current_draw_streak:
          battle.result === 'draw' ? Math.max(0, currentStreak.current_draw_streak - 1) : currentStreak.current_draw_streak,
        total_wins: battle.result === 'win' ? Math.max(0, currentStreak.total_wins - 1) : currentStreak.total_wins,
        total_losses: battle.result === 'lose' ? Math.max(0, currentStreak.total_losses - 1) : currentStreak.total_losses,
        total_draws: battle.result === 'draw' ? Math.max(0, currentStreak.total_draws - 1) : currentStreak.total_draws,
        total_plays: Math.max(0, currentStreak.total_plays - 1),
      }
    : {
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

  const newStreak = updateStreakState(baseForRematch, rematchResult, now)

  const { data: streak, error: streakError } = await supabase
    .from('dice_streak_state')
    .upsert({ ...newStreak, user_id: user.id })
    .select('*')
    .single()

  if (streakError || !streak) {
    return NextResponse.json({ error: '스트릭 업데이트 중 오류가 발생했습니다.' }, { status: 500 })
  }

  const response: RematchResponse = { battle: updatedBattle, streak }
  return NextResponse.json(response)
}
