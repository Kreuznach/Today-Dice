'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ResultDisplay from '@/features/dice/components/ResultDisplay'
import StreakBadge from '@/features/dice/components/StreakBadge'
import MidnightCountdown from '@/features/dice/components/MidnightCountdown'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { getTomorrowHint } from '@/lib/milestones'
import type { RematchResponse } from '@/types'

export default function FinalResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<RematchResponse | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('rematch_result')
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
        <h1 className="text-xl font-bold text-gray-900">최종 결과</h1>
        <p className="text-sm text-blue-500 font-medium">오늘의 기록이 확정됐어요</p>
      </div>

      <Card className="flex flex-col gap-6">
        <p className="text-center text-xs font-semibold text-indigo-500">오늘의 증표</p>
        <ResultDisplay battle={result.battle} isFinal streak={result.streak} />

        {result.streak && (
          <div className="flex justify-center">
            <StreakBadge streak={result.streak} />
          </div>
        )}
      </Card>

      <Card padding="p-4" className="bg-blue-50 border-blue-100">
        <div className="flex flex-col gap-2">
          <MidnightCountdown />
          <p className="text-sm text-blue-700 text-center leading-relaxed">
            {getTomorrowHint(true, result.streak)}
            <br />
            <span className="text-xs text-blue-500">매일 1번 주사위를 굴릴 수 있어요</span>
          </p>
        </div>
      </Card>

      {result.streak && (
        <Card padding="p-4">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-base font-semibold text-gray-700">{result.streak.max_win_streak}</p>
              <p className="text-xs text-gray-500 mt-0.5">최고 연승</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div>
              <p className="text-base font-semibold text-gray-700">{result.streak.total_plays}</p>
              <p className="text-xs text-gray-500 mt-0.5">총 플레이</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div>
              <p className="text-base font-semibold text-gray-700">
                {result.streak.total_plays > 0
                  ? Math.round((result.streak.total_wins / result.streak.total_plays) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-0.5">승률</p>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-auto">
        <Link href="/">
          <Button fullWidth>홈으로</Button>
        </Link>
      </div>
    </main>
  )
}
