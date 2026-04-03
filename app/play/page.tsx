'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DiceFace from '@/components/dice/DiceFace'
import Button from '@/components/ui/Button'
import { usePlay } from '@/features/dice/hooks/usePlay'

type Phase = 'idle' | 'rolling' | 'done'

export default function PlayPage() {
  const router = useRouter()
  const { play, loading, error } = usePlay()
  const [phase, setPhase] = useState<Phase>('idle')
  const [displayValue, setDisplayValue] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)

  const handleRoll = useCallback(async () => {
    if (phase !== 'idle') return
    setPhase('rolling')

    // API 요청과 애니메이션을 병렬로 시작
    const resultPromise = play()

    // 주사위 굴리기 애니메이션 (700ms)
    const frames = [1, 3, 5, 2, 6, 4, 1, 5, 3, 6] as const
    let i = 0
    const ticker = setInterval(() => {
      setDisplayValue(frames[i % frames.length])
      i++
    }, 70)

    const [result] = await Promise.all([
      resultPromise,
      new Promise((r) => setTimeout(r, 700)),
    ])

    clearInterval(ticker)
    setPhase('done')

    if (result) {
      // 결과를 sessionStorage에 저장 후 결과 화면으로 이동
      sessionStorage.setItem('play_result', JSON.stringify(result))
      router.push('/result')
    } else {
      setPhase('idle')
    }
  }, [phase, play, router])

  return (
    <main className="flex flex-col flex-1 items-center justify-center px-5 py-10 gap-10">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-bold text-gray-900">오늘의 주사위</h1>
        <p className="text-sm text-gray-500">버튼을 탭하면 주사위를 굴립니다</p>
      </div>

      <div
        className={`transition-transform duration-75 ${phase === 'rolling' ? 'animate-bounce' : ''}`}
      >
        <DiceFace value={phase === 'idle' ? 'unknown' : displayValue} size={120} />
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center bg-red-50 px-4 py-3 rounded-2xl max-w-xs">
          {error}
        </p>
      )}

      <div className="w-full max-w-xs">
        <Button
          fullWidth
          onClick={handleRoll}
          disabled={loading || phase === 'rolling'}
        >
          {phase === 'rolling' ? '굴리는 중...' : '주사위 굴리기 🎲'}
        </Button>
      </div>
    </main>
  )
}
