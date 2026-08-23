import type { StreakState } from '@/types'
import { getNextAttendanceMilestone, MILESTONE_LABEL } from '@/lib/milestones'

interface AttendanceBarProps {
  streak: StreakState | null
  playedToday: boolean
}

export default function AttendanceBar({ streak, playedToday }: AttendanceBarProps) {
  const current = streak?.current_attendance_streak ?? 0
  const next = getNextAttendanceMilestone(current)

  if (!streak && !playedToday) {
    return (
      <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
        <span className="text-sm font-semibold text-amber-800">연속 방문 0일</span>
        <span className="text-xs text-amber-600">오늘 오면 시작돼요</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-amber-50 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-amber-800">
          {playedToday ? '오늘 출석 완료' : '연속 방문'} · {current}일
        </span>
        {next && (
          <span className="text-xs text-amber-600">
            {MILESTONE_LABEL[next.target]}까지 {next.remain}일
          </span>
        )}
      </div>
      {next && (
        <div className="h-1.5 overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-amber-400"
            style={{ width: `${Math.min(100, Math.round((current / next.target) * 100))}%` }}
          />
        </div>
      )}
    </div>
  )
}
