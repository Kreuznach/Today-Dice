'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import BadgeShelf from '@/features/dice/components/BadgeShelf'
import DiceDex from '@/features/dice/components/DiceDex'
import LuckCalendar from '@/features/dice/components/LuckCalendar'
import WeekBoard from '@/features/dice/components/WeekBoard'
import { getOrCreateGuestId } from '@/lib/auth'
import { getTodayKST } from '@/lib/date-utils'
import { getHonorific } from '@/lib/milestones'
import { getMyRecords } from '@/lib/supabase'
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

function WinRateBar({ wins, total }: { wins: number; total: number }) {
  const rate = total > 0 ? Math.round((wins / total) * 100) : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs text-gray-500">
        <span>승률</span>
        <span className="font-semibold text-blue-500">{rate}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-400 rounded-full transition-all duration-500"
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  )
}

function RollCountBar({ face, count, max }: { face: number; count: number; max: number }) {
  const width = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-4 text-center font-semibold text-gray-700">{face}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-400 rounded-full"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{count}회</span>
    </div>
  )
}

export default function MyRecordsPage() {
  const [data, setData] = useState<MyRecordsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = getOrCreateGuestId()
    getMyRecords(userId)
      .then(setData)
      .catch(() => setError('기록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const streak = data?.streak ?? null
  const today = getTodayKST()
  const honorific = streak
    ? getHonorific(streak.max_attendance_streak ?? 0, streak.total_plays)
    : null
  const recentSeven = (data?.battles ?? []).slice(0, 7)

  const rollCounts = streak
    ? [
        { face: 1, count: streak.roll_count_1 ?? 0 },
        { face: 2, count: streak.roll_count_2 ?? 0 },
        { face: 3, count: streak.roll_count_3 ?? 0 },
        { face: 4, count: streak.roll_count_4 ?? 0 },
        { face: 5, count: streak.roll_count_5 ?? 0 },
        { face: 6, count: streak.roll_count_6 ?? 0 },
      ]
    : []
  const maxRollCount = rollCounts.length > 0 ? Math.max(...rollCounts.map((r) => r.count), 1) : 1

  const titleName = data?.display_name
    ? `${honorific ? `${honorific} ` : ''}${data.display_name}님의 정보`
    : '내 정보'

  return (
    <main className="flex flex-col flex-1 px-5 pt-8 pb-8 gap-6">
      {/* 헤더: 사용자 이름 */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-bold text-gray-900">{titleName}</h1>
        <p className="text-sm text-gray-500">누적 통계 및 연속 기록</p>
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
          {/* 누적 통계 */}
          {streak && (
            <Card className="flex flex-col gap-5">
              <p className="text-sm font-semibold text-gray-700">누적 통계</p>

              {/* 승/패/무/총 요약 */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-800">{streak.total_plays}</p>
                  <p className="text-xs text-gray-500 mt-0.5">총 플레이</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-500">{streak.total_wins}</p>
                  <p className="text-xs text-gray-500 mt-0.5">승리</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-400">{streak.total_losses}</p>
                  <p className="text-xs text-gray-500 mt-0.5">패배</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-500">{streak.total_draws}</p>
                  <p className="text-xs text-gray-500 mt-0.5">무승부</p>
                </div>
              </div>

              {/* 승률 그래프 */}
              <WinRateBar wins={streak.total_wins} total={streak.total_plays} />

              {/* 주사위 숫자별 나온 횟수 */}
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500">주사위 숫자별 나온 횟수</p>
                {rollCounts.map(({ face, count }) => (
                  <RollCountBar key={face} face={face} count={count} max={maxRollCount} />
                ))}
              </div>
            </Card>
          )}

          {/* 나의 연속 기록 (최고) */}
          {streak && (
            <Card className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-gray-700">나의 연속 기록 <span className="text-xs font-normal text-gray-400">(최고)</span></p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">연속 승리</span>
                  <span className="text-sm font-bold text-blue-500">{streak.max_win_streak}연승</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">연속 패배</span>
                  <span className="text-sm font-bold text-red-400">{streak.max_lose_streak}연패</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">연속 무승부</span>
                  <span className="text-sm font-bold text-gray-500">{streak.max_draw_streak}연속</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">연속 출석</span>
                  <span className="text-sm font-bold text-green-500">{streak.max_attendance_streak ?? 0}일</span>
                </div>
              </div>

              <div className="border-t border-gray-50 pt-3 flex flex-col gap-3">
                <p className="text-xs text-gray-400">광고 재대결 결과</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-base font-bold text-blue-400">{streak.total_rematch_wins ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">역전승</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-400">{streak.total_rematch_draws ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">무승부</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-red-400">{streak.total_rematch_losses ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">역전패</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="flex flex-col gap-5">
            <WeekBoard battles={data.battles} today={today} />
            <LuckCalendar battles={data.battles} today={today} />
          </Card>

          {streak && (
            <Card className="flex flex-col gap-5">
              <BadgeShelf
                maxAttendance={streak.max_attendance_streak ?? 0}
                totalPlays={streak.total_plays}
              />
              <DiceDex
                counts={[
                  streak.roll_count_1 ?? 0,
                  streak.roll_count_2 ?? 0,
                  streak.roll_count_3 ?? 0,
                  streak.roll_count_4 ?? 0,
                  streak.roll_count_5 ?? 0,
                  streak.roll_count_6 ?? 0,
                ]}
              />
            </Card>
          )}

          {/* 최근 7일 기록 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-gray-700 px-1">최근 7일 기록</p>
            <Card padding="p-0" className="overflow-hidden">
              {recentSeven.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">아직 플레이 기록이 없어요</p>
              )}
              {recentSeven.map((battle) => (
                <BattleRow key={battle.id} battle={battle} />
              ))}
            </Card>
          </div>
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

