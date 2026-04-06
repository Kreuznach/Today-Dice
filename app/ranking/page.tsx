'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getOrCreateGuestId } from '@/lib/auth'
import { getRanking } from '@/lib/supabase'
import type { RankingResponse } from '@/types'

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

interface TabConfig {
  key: string
  label: string
  unit: string
  description: string
}

const TABS: TabConfig[] = [
  { key: 'win_streak',      label: '연승',       unit: '연승',  description: '최다 연속 승리' },
  { key: 'lose_streak',     label: '연패',       unit: '연패',  description: '최다 연속 패배' },
  { key: 'draw_streak',     label: '연무',       unit: '연무',  description: 'AI와 무승부 연속' },
  { key: 'same_num_streak', label: '같은 번호',  unit: '연속',  description: '같은 숫자 연속 기록' },
  { key: 'rematch_win',     label: '역전승',     unit: '회',    description: '재대결 승리 누적' },
  { key: 'rematch_loss',    label: '역전패',     unit: '회',    description: '재대결 패배 누적' },
]

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState<string>('win_streak')
  const [data, setData] = useState<RankingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRanking = useCallback((category: string) => {
    setLoading(true)
    setError(null)
    const userId = getOrCreateGuestId()
    getRanking(category, userId)
      .then(setData)
      .catch(() => setError('랭킹을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRanking(activeTab)
  }, [activeTab, fetchRanking])

  const currentTab = TABS.find((t) => t.key === activeTab)!

  return (
    <main className="flex flex-col flex-1 px-5 pt-6 pb-8 gap-4">
      {/* 헤더 */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-gray-900">랭킹</h1>
        <p className="text-sm text-gray-500">각 부문 TOP 10</p>
      </div>

      {/* 탭 — 2줄 그리드 */}
      <div className="grid grid-cols-3 gap-1.5">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'py-2 px-1 rounded-xl text-xs font-semibold transition-all',
                isActive
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 탭 설명 */}
      <p className="text-xs text-gray-400 text-center">{currentTab.description}</p>

      {/* 로딩 */}
      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner size={32} />
        </div>
      )}

      {/* 에러 */}
      {!loading && error && (
        <Card>
          <p className="text-sm text-red-500 text-center">{error}</p>
        </Card>
      )}

      {/* 랭킹 목록 */}
      {!loading && data && (
        <>
          <Card padding="p-0" className="overflow-hidden">
            {data.entries.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-10">
                아직 기록이 없어요
              </p>
            )}
            {data.entries.map((entry, i) => (
              <div
                key={i}
                className="flex items-center px-5 py-3.5 border-b border-gray-50 last:border-0"
              >
                <span className="w-8 text-lg shrink-0">
                  {MEDAL[entry.rank] ?? entry.rank}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                  {entry.display_name}
                </span>
                <span className="text-sm font-bold text-blue-500 shrink-0">
                  {entry.score}
                  <span className="text-xs font-normal text-blue-400 ml-0.5">
                    {currentTab.unit}
                  </span>
                </span>
              </div>
            ))}
          </Card>

          {/* 내 순위 */}
          {data.my_rank !== null && data.my_score !== null && (
            <Card padding="p-4" className="bg-blue-50 border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 font-medium">내 순위</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-blue-600">
                    {data.my_score}
                    <span className="text-xs font-normal ml-0.5">{currentTab.unit}</span>
                  </span>
                  <span className="text-xs text-blue-500">{data.my_rank}위</span>
                </div>
              </div>
            </Card>
          )}

          {data.updated_at && (
            <p className="text-xs text-gray-400 text-center">
              마지막 갱신:{' '}
              {new Date(data.updated_at).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
              })}
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

