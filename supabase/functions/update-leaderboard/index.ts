import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (_req) => {
  try {
    // 1. dice_streak_state에서 max_win_streak 기준 TOP5 추출
    const { data: top5, error: fetchError } = await supabase
      .from('dice_streak_state')
      .select('user_id, max_win_streak, last_streak_achieved_at')
      .order('max_win_streak', { ascending: false })
      .order('last_streak_achieved_at', { ascending: true })
      .limit(5)

    if (fetchError) throw fetchError

    if (!top5 || top5.length === 0) {
      return new Response(JSON.stringify({ message: '집계할 데이터가 없습니다.' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. 닉네임 조회
    const userIds = top5.map((r) => r.user_id)
    const { data: users, error: usersError } = await supabase
      .from('dice_users')
      .select('id, display_name')
      .in('id', userIds)

    if (usersError) throw usersError

    const nameMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.display_name]))

    // 3. dice_leaderboard_cache UPSERT
    const now = new Date().toISOString()
    const upsertRows = top5.map((row, i) => ({
      category: 'win_streak',
      rank: i + 1,
      user_id: row.user_id,
      score: row.max_win_streak,
      achieved_at: row.last_streak_achieved_at ?? now,
      display_name: nameMap[row.user_id] ?? '주사위 플레이어',
      updated_at: now,
    }))

    const { error: upsertError } = await supabase
      .from('dice_leaderboard_cache')
      .upsert(upsertRows, { onConflict: 'category,rank' })

    if (upsertError) throw upsertError

    return new Response(
      JSON.stringify({ message: '랭킹 갱신 완료', count: upsertRows.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('update-leaderboard error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
