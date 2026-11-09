'use client'

import Link from 'next/link'
import { useTodayStatus } from '@/features/dice/hooks/useTodayStatus'
import StreakBadge from '@/features/dice/components/StreakBadge'
import ResultDisplay from '@/features/dice/components/ResultDisplay'
import AttendanceBar from '@/features/dice/components/AttendanceBar'
import MidnightCountdown from '@/features/dice/components/MidnightCountdown'
import RematchButton from '@/features/dice/components/RematchButton'
import WeekBoard from '@/features/dice/components/WeekBoard'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getTodayKST } from '@/lib/date-utils'
import { getTomorrowHint, isAttendanceMilestone } from '@/lib/milestones'

export default function HomePage() {
  const { data, loading, error } = useTodayStatus()
  const today = getTodayKST()

  return (
    <main className="flex flex-col flex-1 px-5 pt-10 pb-28 gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">오늘의 주사위</h1>
        <p className="text-sm text-gray-500">오늘의 운을 확인해보세요</p>
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner size={36} />
        </div>
      )}

      {!loading && error && (
        <Card>
          <p className="text-sm text-red-500 text-center">{error}</p>
        </Card>
      )}

      {!loading && !error && data && (
        <>
          <AttendanceBar streak={data.streak} playedToday={data.played} />

          {data.streak && (
            <div>
              <StreakBadge streak={data.streak} />
            </div>
          )}

          {!data.played && (
            <Card className="flex flex-col items-center gap-6 py-10">
              <div className="text-5xl">🎲</div>
              <p className="text-lg font-semibold text-gray-800 text-center">
                오늘의 주사위,<br />아직 안 굴렸어요
              </p>
              <p className="text-sm text-gray-500 text-center">
                {getTomorrowHint(false, data.streak)}
              </p>
              <Link href="/play" className="w-full">
                <Button fullWidth>오늘 주사위 굴리기</Button>
              </Link>
            </Card>
          )}

          {data.played && data.battle && !data.battle.has_rematch && (
            <Card className="flex flex-col gap-5">
              <p className="text-sm text-gray-500 text-center font-medium">오늘 결과</p>
              <ResultDisplay battle={data.battle} streak={data.streak} compact />
              <MidnightCountdown />
              <p className="text-xs text-center text-gray-400">
                {getTomorrowHint(true, data.streak)}
              </p>
              <RematchButton
                hasRematch={false}
                result={data.battle.result}
                loseStreak={data.streak?.current_lose_streak ?? 0}
              />
              <Link href={`/result?battleId=${data.battle.id}`} className="w-full">
                <Button variant="secondary" fullWidth>결과 자세히 보기</Button>
              </Link>
            </Card>
          )}

          {data.played && data.battle && data.battle.has_rematch && (
            <Card className="flex flex-col gap-5">
              <p className="text-sm text-gray-500 text-center font-medium">오늘 최종 결과</p>
              <ResultDisplay battle={data.battle} isFinal streak={data.streak} compact />
              <MidnightCountdown />
              <p className="text-xs text-center text-gray-400">
                {getTomorrowHint(true, data.streak)}
              </p>
            </Card>
          )}

          <Card padding="p-4">
            <WeekBoard battles={data.recentBattles ?? []} today={today} />
          </Card>

          {data.played &&
            data.streak &&
            isAttendanceMilestone(data.streak.current_attendance_streak ?? 0) && (
              <p className="text-center text-xs font-medium text-amber-700">
                오늘 {data.streak.current_attendance_streak}일 이정표에 닿았어요
              </p>
            )}

          {data.streak && (
            <Card padding="p-4">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-xl font-bold text-blue-500">{data.streak.total_wins}</p>
                  <p className="text-xs text-gray-500 mt-1">승</p>
                </div>
                <div className="w-px bg-gray-100" />
                <div>
                  <p className="text-xl font-bold text-red-400">{data.streak.total_losses}</p>
                  <p className="text-xs text-gray-500 mt-1">패</p>
                </div>
                <div className="w-px bg-gray-100" />
                <div>
                  <p className="text-xl font-bold text-gray-500">{data.streak.total_draws}</p>
                  <p className="text-xs text-gray-500 mt-1">무</p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

    </main>
  )
}
