import { getSundayWeekDates, weekdayOfDateStr } from '@/lib/date-utils'
import type { TodayBattle } from '@/types'

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토']

interface WeekBoardProps {
  battles: TodayBattle[]
  today: string
}

export default function WeekBoard({ battles, today }: WeekBoardProps) {
  const dates = getSundayWeekDates(today)
  const byDate = new Map(battles.map((battle) => [battle.battle_date, battle]))

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500">이번 주 출석</p>
      <div className="grid grid-cols-7 gap-1.5">
        {dates.map((date) => {
          const battle = byDate.get(date)
          const isToday = date === today
          const day = weekdayOfDateStr(date)
          const lit = Boolean(battle)
          return (
            <div key={date} className="flex flex-col items-center gap-1">
              <span className={`text-[10px] ${isToday ? 'font-bold text-blue-500' : 'text-gray-400'}`}>
                {DAY_LABEL[day]}
              </span>
              <div
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                  lit
                    ? 'bg-blue-500 text-white'
                    : isToday
                      ? 'border-2 border-dashed border-blue-300 text-blue-400'
                      : 'bg-gray-100 text-gray-300',
                ].join(' ')}
              >
                {lit ? (battle?.final_result === 'win' ? '승' : battle?.final_result === 'lose' ? '패' : '무') : ''}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
