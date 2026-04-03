import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractUserId } from '@/lib/auth'
import { getTodayKST } from '@/lib/date-utils'
import type { TodayStatusResponse } from '@/types'

export async function GET(request: Request) {
  const tossUserId = extractUserId(request)
  if (!tossUserId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const supabase = createServerClient()
  const today = getTodayKST()

  // 사용자 조회
  const { data: user, error: userError } = await supabase
    .from('dice_users')
    .select('id')
    .eq('toss_user_id', tossUserId)
    .single()

  if (userError || !user) {
    const response: TodayStatusResponse = { played: false, battle: null, streak: null }
    return NextResponse.json(response)
  }

  // 오늘 배틀 + 스트릭 병렬 조회
  const [battleRes, streakRes] = await Promise.all([
    supabase
      .from('dice_daily_battle')
      .select('*')
      .eq('user_id', user.id)
      .eq('battle_date', today)
      .single(),
    supabase
      .from('dice_streak_state')
      .select('*')
      .eq('user_id', user.id)
      .single(),
  ])

  const response: TodayStatusResponse = {
    played: !!battleRes.data,
    battle: battleRes.data ?? null,
    streak: streakRes.data ?? null,
  }

  return NextResponse.json(response)
}
