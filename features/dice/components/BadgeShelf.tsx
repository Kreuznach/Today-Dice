import {
  ATTENDANCE_MILESTONES,
  MILESTONE_LABEL,
  getUnlockedAttendanceBadges,
  type AttendanceMilestone,
} from '@/lib/milestones'

interface BadgeShelfProps {
  maxAttendance: number
  totalPlays: number
}

export default function BadgeShelf({ maxAttendance, totalPlays }: BadgeShelfProps) {
  const unlocked = new Set(getUnlockedAttendanceBadges(maxAttendance, totalPlays))

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-700">출석 이정표</p>
      <div className="grid grid-cols-3 gap-2">
        {ATTENDANCE_MILESTONES.map((item: AttendanceMilestone) => {
          const on = unlocked.has(item)
          return (
            <div
              key={item}
              className={[
                'flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center',
                on ? 'bg-amber-50 text-amber-800' : 'bg-gray-50 text-gray-300',
              ].join(' ')}
            >
              <span className="text-lg">{on ? '🏅' : '⬜'}</span>
              <span className="text-[11px] font-semibold">{MILESTONE_LABEL[item]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
