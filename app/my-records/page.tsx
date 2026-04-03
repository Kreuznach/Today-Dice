'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getOrCreateGuestId } from '@/lib/auth'
import type { MyRecordsResponse, TodayBattle } from '@/types'

const RESULT_LABEL: Record<string, { text: string; color: string }> = {
  win: { text: '승', color: 'text-blue-500' },
  lose: { text: '패', color: 'text-red-500' },
  draw: { text: '무', color: 'text-gray-500' },
}

function BattleRow({ battle }: { battle: TodayBattle }) {
  const label = RESULT_LABEL[battle.final_result]
  return (
    <div className="flex items-center px-5 py-4 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-sm text-gray-500 w-24 shrink-0">
        {battle.battle_date}
      </span>
      <span className={`w-6 text-center font-bold text-sm ${label.color}`}>{label.text}</span>
      <span className="text-sm text-gray-600 flex-1">
        {battle.user_roll} vs {battle.ai_roll}
        {battle.has_rematch && battle.rematch_user_roll != null && (
          <span className="text-gray-400 ml-2 text-xs">
            → {battle.rematch_user_roll} vs {battle.rematch_ai_roll} (재대결)
          </span>
        )}
      </span>
    </div>
  )
}

export default function MyRecordsPage() {
  const [data, setData] = useState<MyRecordsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = getOrCreateGuestId()
    fetch('/api/my-records', {
      headers: { Authorization: `Bearer ${userId}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError('기록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="flex flex-col flex-1 px-5 pt-8 pb-8 gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-gray-900">내 기록</h1>
        <p className="text-sm text-gray-500">최근 7일간의 플레이 기록</p>
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner size={32} />
        </div>
      )}

      {!loading && error && (
        <Card>
          <p className="text-sm text-red-500 text-center">{error}</p>
        </Card>
      )}

      {!loading && data && (
        <>
          {/* 스트릭 요약 */}
          {data.streak && (
            <Card padding="p-4">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-lg font-bold text-yellow-500">{data.streak.current_win_streak}</p>
                  <p className="text-xs text-gray-500 mt-0.5">현재 연승</p>
                </div>
                <div className="w-px bg-gray-100" />
                <div>
                  <p className="text-lg font-bold text-gray-800">{data.streak.max_win_streak}</p>
                  <p className="text-xs text-gray-500 mt-0.5">최고 연승</p>
                </div>
                <div className="w-px bg-gray-100" />
                <div>
                  <p className="text-lg font-bold text-red-400">{data.streak.current_lose_streak}</p>
                  <p className="text-xs text-gray-500 mt-0.5">현재 연패</p>
                </div>
                <div className="w-px bg-gray-100" />
                <div>
                  <p className="text-lg font-bold text-gray-600">{data.streak.total_plays}</p>
                  <p className="text-xs text-gray-500 mt-0.5">총 플레이</p>
                </div>
              </div>
            </Card>
          )}

          {/* 7일 기록 목록 */}
          <Card padding="p-0" className="overflow-hidden">
            {data.battles.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">아직 플레이 기록이 없어요</p>
            )}
            {data.battles.map((battle) => (
              <BattleRow key={battle.id} battle={battle} />
            ))}
          </Card>
        </>
      )}

      <div className="mt-auto">
        <Link href="/">
          <Button variant="ghost" fullWidth>홈으로</Button>
        </Link>
      </div>
    </main>
  )
}
