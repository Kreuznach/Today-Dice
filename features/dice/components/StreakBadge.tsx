import type { StreakState } from '@/types'

interface StreakBadgeProps {
  streak: StreakState
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  const { current_win_streak, current_lose_streak, current_draw_streak } = streak

  if (current_win_streak > 0) {
    return (
      <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 text-sm font-semibold px-3 py-1 rounded-full">
        🔥 {current_win_streak}연승 중
      </span>
    )
  }
  if (current_lose_streak > 0) {
    return (
      <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-sm font-semibold px-3 py-1 rounded-full">
        💧 {current_lose_streak}연패 중
      </span>
    )
  }
  if (current_draw_streak > 0) {
    return (
      <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-sm font-semibold px-3 py-1 rounded-full">
        🤝 {current_draw_streak}연속 무승부
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 text-sm px-3 py-1 rounded-full">
      기록 없음
    </span>
  )
}
