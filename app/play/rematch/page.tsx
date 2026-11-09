'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Dice3D from '@/components/dice/Dice3D'
import Button from '@/components/ui/Button'
import { useRematch } from '@/features/dice/hooks/useRematch'
import { loadTodayResult, saveTodayResult } from '@/lib/today-result'

type Phase = 'idle' | 'rolling' | 'done'

const RESULT_LABEL: Record<string, { text: string; color: string }> = {
  win:  { text: '승리! 🎉', color: 'text-blue-600' },
  lose: { text: '패배 😞', color: 'text-red-500' },
  draw: { text: '무승부 🤝', color: 'text-gray-600' },
}

export default function RematchPlayPage() {
  const router = useRouter()
  const { rematch, loading, error } = useRematch()
  const [phase, setPhase] = useState<Phase>('idle')
  const [userValue, setUserValue] = useState<1 | 2 | 3 | 4 | 5 | 6 | 'unknown'>('unknown')
  const [aiValue, setAiValue] = useState<1 | 2 | 3 | 4 | 5 | 6 | 'unknown'>('unknown')
  const [resultLabel, setResultLabel] = useState<{ text: string; color: string } | null>(null)

  // 광고를 보지 않고 직접 URL 접근 방지 (오늘 결과가 없거나 이미 재대결했으면 홈으로)
  useEffect(() => {
    loadTodayResult().then((saved) => {
      if (!saved || saved.battle.has_rematch) router.replace('/')
    })
  }, [router])

  const handleRoll = useCallback(async () => {
    if (phase !== 'idle') return

    setPhase('rolling')
    setUserValue('unknown')
    setAiValue('unknown')
    setResultLabel(null)

    // 최소 1100ms 스핀 보장 + API 병렬 호출
    const [result] = await Promise.all([
      rematch(),
      new Promise<void>((r) => setTimeout(r, 1100)),
    ])

    if (result) {
      const uv = result.battle.rematch_user_roll as 1 | 2 | 3 | 4 | 5 | 6
      const av = result.battle.rematch_ai_roll as 1 | 2 | 3 | 4 | 5 | 6
      const label = RESULT_LABEL[result.battle.rematch_result ?? result.battle.final_result]

      setUserValue(uv)
      setAiValue(av)
      setResultLabel(label)
      setPhase('done')

      // 결과 저장 후 최종 결과 화면으로 이동 (오늘 결과도 재대결 반영본으로 갱신)
      sessionStorage.setItem('rematch_result', JSON.stringify(result))
      saveTodayResult(result)
      setTimeout(() => router.push('/result/final'), 2200)
    } else {
      setPhase('idle')
      setUserValue('unknown')
      setAiValue('unknown')
    }
  }, [phase, rematch, router])

  const isRolling = phase === 'rolling'

  return (
    <main className="flex flex-col flex-1 items-center justify-center px-5 py-10 gap-10">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-bold text-gray-900">재도전!</h1>
        <p className="text-sm text-blue-500 font-medium">
          오늘의 마지막 주사위예요
        </p>
        <p className="text-sm text-gray-500">
          {isRolling ? '주사위가 구르는 중...' : '버튼을 탭하면 주사위를 굴립니다'}
        </p>
      </div>

      {/* 양쪽 주사위 동시 표시 */}
      <div className="flex items-center justify-center gap-10">
        <Dice3D
          value={userValue}
          size={100}
          rolling={isRolling}
          label="나"
        />

        <span className="text-3xl text-gray-200 font-light select-none">vs</span>

        <Dice3D
          value={aiValue}
          size={100}
          rolling={isRolling}
          label="AI"
        />
      </div>

      {/* 결과 레이블 (done 상태에서만) */}
      {phase === 'done' && resultLabel && (
        <p className={`text-2xl font-bold ${resultLabel.color} animate-pulse`}>
          {resultLabel.text}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center bg-red-50 px-4 py-3 rounded-2xl max-w-xs">
          {error}
        </p>
      )}

      <div className="w-full max-w-xs">
        <Button
          fullWidth
          onClick={handleRoll}
          disabled={loading || phase !== 'idle'}
        >
          {isRolling ? '굴리는 중...' : phase === 'done' ? '결과 확인 중...' : '주사위 굴리기 🎲'}
        </Button>
      </div>
    </main>
  )
}
