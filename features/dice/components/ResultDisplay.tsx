import { useMemo } from 'react'
import DiceFace from '@/components/dice/DiceFace'
import { getFortuneScaleLabel, getTodayFortune } from '@/lib/fortune'
import { detectRareEvents } from '@/lib/milestones'
import type { StreakState, TodayBattle } from '@/types'

interface ResultDisplayProps {
  battle: TodayBattle
  isFinal?: boolean
  streak?: StreakState | null
  compact?: boolean
}

const RESULT_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  win: { text: '승리!', color: 'text-blue-600', bg: 'bg-blue-50' },
  lose: { text: '패배', color: 'text-red-500', bg: 'bg-red-50' },
  draw: { text: '무승부', color: 'text-gray-600', bg: 'bg-gray-50' },
}

export default function ResultDisplay({
  battle,
  isFinal = false,
  streak = null,
  compact = false,
}: ResultDisplayProps) {
  const result = isFinal ? battle.final_result : battle.result
  const userRoll = isFinal && battle.has_rematch ? battle.rematch_user_roll! : battle.user_roll
  const aiRoll = isFinal && battle.has_rematch ? battle.rematch_ai_roll! : battle.ai_roll
  const label = RESULT_LABEL[result]
  const fortune = useMemo(
    () => getTodayFortune(userRoll, result, battle.battle_date),
    [userRoll, result, battle.battle_date],
  )
  const events = useMemo(
    () => detectRareEvents(battle, streak, isFinal),
    [battle, streak, isFinal],
  )
  const hasRare = events.length > 0

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className={[
          'w-full rounded-3xl px-4 py-5',
          hasRare ? 'ring-2 ring-amber-300 bg-amber-50/40' : '',
        ].join(' ')}
      >
        <div className="flex flex-col items-center gap-5">
          <div className={`px-6 py-2 rounded-full text-2xl font-bold ${label.bg} ${label.color}`}>
            {label.text}
          </div>
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">나</span>
              <DiceFace value={userRoll as 1 | 2 | 3 | 4 | 5 | 6} size={compact ? 64 : 80} />
              <span className="text-2xl font-bold text-gray-800">{userRoll}</span>
            </div>
            <span className="text-3xl text-gray-300 font-light">vs</span>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">AI</span>
              <DiceFace value={aiRoll as 1 | 2 | 3 | 4 | 5 | 6} size={compact ? 64 : 80} />
              <span className="text-2xl font-bold text-gray-800">{aiRoll}</span>
            </div>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="flex w-full flex-col items-center gap-2 text-center">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
            오늘의 키워드 · {fortune.keyword}
          </span>
          <p className="text-sm text-gray-600 leading-relaxed">{fortune.line}</p>
          <p className="text-xs text-gray-400">{fortune.note}</p>
          <p className="text-xs text-gray-400">
            오늘의 기운 {getFortuneScaleLabel(userRoll)}
          </p>
        </div>
      )}

      {hasRare && (
        <div className="flex w-full flex-col gap-2">
          {events.map((event) => (
            <div
              key={event.key}
              className="rounded-2xl bg-amber-50 px-3 py-2 text-center"
            >
              <p className="text-xs font-semibold text-amber-800">{event.title}</p>
              <p className="text-[11px] text-amber-700">{event.detail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
