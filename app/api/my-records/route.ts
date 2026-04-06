import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractUserId } from '@/lib/auth'
import { getTodayKST } from '@/lib/date-utils'
import type { MyRecordsResponse } from '@/types'

export async function GET(request: Request) {
  const tossUserId = extractUserId(request)
  if (!tossUserId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const supabase = createServerClient()

  const { data: user } = await supabase
    .from('dice_users')
    .select('id, display_name')
    .eq('toss_user_id', tossUserId)
    .single()

  if (!user) {
    const response: MyRecordsResponse = { display_name: null, battles: [], streak: null }
    return NextResponse.json(response)
  }

  // 최근 7일 날짜 범위 계산
  const today = getTodayKST()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const fromDate = sevenDaysAgo.toISOString().slice(0, 10)

  const [battlesRes, streakRes] = await Promise.all([
    supabase
      .from('dice_daily_battle')
      .select('*')
      .eq('user_id', user.id)
      .gte('battle_date', fromDate)
      .lte('battle_date', today)
      .order('battle_date', { ascending: false }),
    supabase
      .from('dice_streak_state')
      .select('*')
      .eq('user_id', user.id)
      .single(),
  ])

  const response: MyRecordsResponse = {
    display_name: user.display_name ?? null,
    battles: battlesRes.data ?? [],
    streak: streakRes.data ?? null,
  }

  return NextResponse.json(response)
}
