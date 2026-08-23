'use client'

import { useState } from 'react'
import { getLastNDates } from '@/lib/date-utils'
import type { TodayBattle } from '@/types'

interface LuckCalendarProps {
  battles: TodayBattle[]
  today: string
}

const CELL_CLASS: Record<string, string> = {
  win: 'bg-blue-400',
  lose: 'bg-gray-300',
  draw: 'bg-white border border-dashed border-gray-400',
}

export default function LuckCalendar({ battles, today }: LuckCalendarProps) {
  const dates = getLastNDates(today, 30)
  const byDate = new Map(battles.map((battle) => [battle.battle_date, battle]))
  const [selected, setSelected] = useState<string | null>(null)
  const selectedBattle = selected ? byDate.get(selected) ?? null : null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500">최근 30일 운의 달력</p>
      <div className="grid grid-cols-10 gap-1">
        {dates.map((date) => {
          const battle = byDate.get(date)
          const result = battle?.final_result
          const isToday = date === today
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelected(date)}
              className={[
                'h-5 w-full rounded-sm',
                result ? CELL_CLASS[result] : 'bg-gray-100',
                selected === date ? 'ring-2 ring-indigo-400' : '',
                isToday ? 'outline outline-1 outline-offset-1 outline-blue-300' : '',
              ].join(' ')}
              aria-label={date}
            />
          )
        })}
      </div>
      <div className="flex gap-3 text-[10px] text-gray-400">
        <span className="inline-flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm bg-blue-400" />승</span>
        <span className="inline-flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm bg-gray-300" />패</span>
        <span className="inline-flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm border border-dashed border-gray-400" />무</span>
        <span className="inline-flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm bg-gray-100" />결석</span>
      </div>
      {selected && (
        <p className="text-xs text-gray-600">
          {selected}
          {selectedBattle
            ? ` · ${selectedBattle.final_result === 'win' ? '승' : selectedBattle.final_result === 'lose' ? '패' : '무'} · ${selectedBattle.has_rematch && selectedBattle.rematch_user_roll != null ? selectedBattle.rematch_user_roll : selectedBattle.user_roll} vs ${selectedBattle.has_rematch && selectedBattle.rematch_ai_roll != null ? selectedBattle.rematch_ai_roll : selectedBattle.ai_roll}`
            : ' · 기록이 없어요'}
        </p>
      )}
    </div>
  )
}
