'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getOrCreateGuestId } from '@/lib/auth'
import type { RankingResponse } from '@/types'

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function RankingPage() {
  const [data, setData] = useState<RankingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = getOrCreateGuestId()
    fetch('/api/ranking?category=win_streak', {
      headers: { Authorization: `Bearer ${userId}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError('랭킹을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="flex flex-col flex-1 px-5 pt-8 pb-8 gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-gray-900">연승 랭킹</h1>
        <p className="text-sm text-gray-500">역대 최고 연승 TOP5</p>
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
          <Card padding="p-0" className="overflow-hidden">
            {data.entries.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">아직 랭킹이 없어요</p>
            )}
            {data.entries.map((entry, i) => (
              <div
                key={i}
                className="flex items-center px-5 py-4 border-b border-gray-50 last:border-0"
              >
                <span className="w-8 text-lg">{MEDAL[entry.rank] ?? entry.rank}</span>
                <span className="flex-1 text-sm font-medium text-gray-800">{entry.display_name}</span>
                <span className="text-sm font-bold text-blue-500">{entry.score}연승</span>
              </div>
            ))}
          </Card>

          {data.my_rank !== null && data.my_score !== null && (
            <Card padding="p-4" className="bg-blue-50 border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 font-medium">내 순위</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-blue-600">{data.my_score}연승</span>
                  <span className="text-xs text-blue-500">{data.my_rank}위</span>
                </div>
              </div>
            </Card>
          )}

          {data.updated_at && (
            <p className="text-xs text-gray-400 text-center">
              마지막 갱신: {new Date(data.updated_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
            </p>
          )}
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
