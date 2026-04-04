import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractUserId } from '@/lib/auth'
import type { RankingResponse } from '@/types'

// 허용된 카테고리 → 실제 컬럼명 매핑
const CATEGORY_COLUMN: Record<string, string> = {
  win_streak:      'max_win_streak',
  lose_streak:     'max_lose_streak',
  draw_streak:     'max_draw_streak',
  same_num_streak: 'max_same_num_streak',
  rematch_win:     'total_rematch_wins',
  rematch_loss:    'total_rematch_losses',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawCategory = searchParams.get('category') ?? 'win_streak'
  // 화이트리스트 검증
  const category = rawCategory in CATEGORY_COLUMN ? rawCategory : 'win_streak'
  const column = CATEGORY_COLUMN[category]

  const tossUserId = extractUserId(request)
  const supabase = createServerClient()

  // TOP 10 — dice_streak_state JOIN dice_users (고정 컬럼, 정렬만 동적)
  const { data: topRows, error } = await supabase
    .from('dice_streak_state')
    .select(
      'user_id, max_win_streak, max_lose_streak, max_draw_streak, ' +
      'max_same_num_streak, total_rematch_wins, total_rematch_losses, ' +
      'last_streak_achieved_at, updated_at, dice_users!inner(display_name)'
    )
    .order(column, { ascending: false })
    .gt(column, 0)
    .limit(10)

  if (error) {
    return NextResponse.json({ error: '랭킹 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }

  let myRank: number | null = null
  let myScore: number | null = null

  if (tossUserId) {
    const { data: myUser } = await supabase
      .from('dice_users')
      .select('id')
      .eq('toss_user_id', tossUserId)
      .single()

    if (myUser) {
      const { data: myRow } = await supabase
        .from('dice_streak_state')
        .select(column)
        .eq('user_id', myUser.id)
        .single()

      if (myRow) {
        myScore = ((myRow as unknown) as Record<string, number>)[column] ?? null

        if (myScore !== null && myScore > 0) {
          const { count } = await supabase
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
      is_me: false,
    }
  })

  const response: RankingResponse = {
    category,
    entries,
    my_rank: myRank,
    my_score: myScore,
    updated_at: updatedAt,
  }

  return NextResponse.json(response)
}

