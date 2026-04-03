import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractUserId } from '@/lib/auth'
import type { RankingResponse } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') ?? 'win_streak'

  const tossUserId = extractUserId(request)
  const supabase = createServerClient()

  // 랭킹 TOP5 조회
  const { data: entries, error } = await supabase
    .from('dice_leaderboard_cache')
    .select('rank, display_name, score, achieved_at, user_id, updated_at')
    .eq('category', category)
    .order('rank', { ascending: true })
    .limit(5)

  if (error) {
    return NextResponse.json({ error: '랭킹 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }

  let myRank: number | null = null
  let myScore: number | null = null

  if (tossUserId) {
    const { data: user } = await supabase
      .from('dice_users')
      .select('id')
      .eq('toss_user_id', tossUserId)
      .single()

    if (user) {
      const { data: myStreak } = await supabase
        .from('dice_streak_state')
        .select('max_win_streak')
        .eq('user_id', user.id)
        .single()

      if (myStreak) {
        myScore = myStreak.max_win_streak

        // 내 순위: 나보다 높은 점수 사람 수 + 1
        const { count } = await supabase
          .from('dice_streak_state')
          .select('*', { count: 'exact', head: true })
          .gt('max_win_streak', myScore)

        myRank = (count ?? 0) + 1
      }
    }
  }

  const updatedAt = entries?.[0]?.updated_at ?? null

  const response: RankingResponse = {
    category,
    entries: (entries ?? []).map((e) => ({
      rank: e.rank,
      display_name: e.display_name,
      score: e.score,
      achieved_at: e.achieved_at,
      is_me: false,
    })),
    my_rank: myRank,
    my_score: myScore,
    updated_at: updatedAt,
  }

  return NextResponse.json(response)
}
