'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ResultDisplay from '@/features/dice/components/ResultDisplay'
import StreakBadge from '@/features/dice/components/StreakBadge'
import RematchButton from '@/features/dice/components/RematchButton'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import type { PlayResponse } from '@/types'

export default function ResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<PlayResponse | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('play_result')
    if (!raw) {
      router.replace('/')
      return
    }
    try {
      setResult(JSON.parse(raw))
    } catch {
      router.replace('/')
    }
  }, [router])

  if (!result) return null

  return (
    <main className="flex flex-col flex-1 px-5 pt-8 pb-8 gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-gray-900">오늘의 결과</h1>
      </div>

      <Card className="flex flex-col gap-6">
        <ResultDisplay battle={result.battle} streak={result.streak} />

        {result.streak && (
          <div className="flex justify-center">
            <StreakBadge streak={result.streak} />
          </div>
        )}

        {result.streak && result.streak.total_plays <= 1 && (
          <p className="text-xs text-center text-indigo-500">
            이 기록은 내일부터 이어져요. 끊기지 않게만 오면 됩니다.
          </p>
        )}

        {result.streak && result.streak.max_win_streak > 1 && (
          <p className="text-xs text-center text-gray-400">
            역대 최고 연승: {result.streak.max_win_streak}연승
          </p>
        )}
      </Card>

      <RematchButton
        hasRematch={result.battle.has_rematch}
        result={result.battle.result}
        loseStreak={result.streak?.current_lose_streak ?? 0}
      />

      <div className="mt-auto">
        <Link href="/">
          <Button variant="ghost" fullWidth>홈으로</Button>
        </Link>
      </div>
    </main>
  )
}
