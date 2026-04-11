import { useMemo } from 'react'
import DiceFace from '@/components/dice/DiceFace'
import { getDiceReaction } from '@/lib/dice-reactions'
import type { TodayBattle } from '@/types'

interface ResultDisplayProps {
  battle: TodayBattle
  isFinal?: boolean
}

const RESULT_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  win: { text: '승리!', color: 'text-blue-600', bg: 'bg-blue-50' },
  lose: { text: '패배', color: 'text-red-500', bg: 'bg-red-50' },
  draw: { text: '무승부', color: 'text-gray-600', bg: 'bg-gray-50' },
}

export default function ResultDisplay({ battle, isFinal = false }: ResultDisplayProps) {
  const result = isFinal ? battle.final_result : battle.result
  const userRoll = isFinal && battle.has_rematch ? battle.rematch_user_roll! : battle.user_roll
  const aiRoll = isFinal && battle.has_rematch ? battle.rematch_ai_roll! : battle.ai_roll
  const label = RESULT_LABEL[result]
  const reaction = useMemo(() => getDiceReaction(userRoll), [userRoll])

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={`px-6 py-2 rounded-full text-2xl font-bold ${label.bg} ${label.color}`}>
        {label.text}
      </div>
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">나</span>
          <DiceFace value={userRoll as 1 | 2 | 3 | 4 | 5 | 6} size={80} />
          <span className="text-2xl font-bold text-gray-800">{userRoll}</span>
        </div>
        <span className="text-3xl text-gray-300 font-light">vs</span>
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">AI</span>
          <DiceFace value={aiRoll as 1 | 2 | 3 | 4 | 5 | 6} size={80} />
          <span className="text-2xl font-bold text-gray-800">{aiRoll}</span>
        </div>
      </div>
      <p className="text-sm text-gray-500 text-center">{reaction}</p>
    </div>
  )
}
