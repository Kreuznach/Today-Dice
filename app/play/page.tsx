'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Dice3D from '@/components/dice/Dice3D'
import Button from '@/components/ui/Button'
import { usePlay } from '@/features/dice/hooks/usePlay'

type Phase = 'idle' | 'rolling' | 'done'

const RESULT_LABEL: Record<string, { text: string; color: string }> = {
  win:  { text: '승리! 🎉', color: 'text-blue-600' },
  lose: { text: '패배 😞', color: 'text-red-500' },
  draw: { text: '무승부 🤝', color: 'text-gray-600' },
}

export default function PlayPage() {
  const router = useRouter()
  const { play, loading, error } = usePlay()
  const [phase, setPhase] = useState<Phase>('idle')
  const [userValue, setUserValue] = useState<1 | 2 | 3 | 4 | 5 | 6 | 'unknown'>('unknown')
  const [aiValue, setAiValue] = useState<1 | 2 | 3 | 4 | 5 | 6 | 'unknown'>('unknown')
  const [resultLabel, setResultLabel] = useState<{ text: string; color: string } | null>(null)

  const handleRoll = useCallback(async () => {
    if (phase !== 'idle') return

    setPhase('rolling')
    setUserValue('unknown')
    setAiValue('unknown')
    setResultLabel(null)

    // 최소 1100ms 스핀 보장 + API 병렬 호출
    const [result] = await Promise.all([
      play(),
      new Promise<void>((r) => setTimeout(r, 1100)),
    ])

    if (result) {
      // 두 주사위 동시에 결과 공개
      const uv = result.battle.user_roll as 1 | 2 | 3 | 4 | 5 | 6
      const av = result.battle.ai_roll as 1 | 2 | 3 | 4 | 5 | 6
      const label = RESULT_LABEL[result.battle.result]

      setUserValue(uv)
      setAiValue(av)
      setResultLabel(label)
      setPhase('done')

      // sessionStorage 저장 후 결과 화면으로 이동 (3D 전환 애니메이션 감상 시간)
      sessionStorage.setItem('play_result', JSON.stringify(result))
      setTimeout(() => router.push('/result'), 2200)
    } else {
      setPhase('idle')
      setUserValue('unknown')
      setAiValue('unknown')
    }
  }, [phase, play, router])

  const isRolling = phase === 'rolling'

  return (
    <main className="flex flex-col flex-1 items-center justify-center px-5 py-10 gap-10">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-bold text-gray-900">오늘의 주사위</h1>
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
