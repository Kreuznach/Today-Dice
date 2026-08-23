'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { watchAd } from '@/lib/ads'

interface RematchButtonProps {
  hasRematch: boolean
  result?: 'win' | 'lose' | 'draw'
  loseStreak?: number
}

/**
 * 재대결 버튼 — 광고 시청 후 /play/rematch 로 이동
 *
 * 플로우: [버튼 클릭] → [광고 시청] → /play/rematch → 주사위 애니메이션 → /result/final
 */
function rematchHint(
  result?: 'win' | 'lose' | 'draw',
  loseStreak?: number,
): string {
  if (result === 'lose' && (loseStreak ?? 0) > 1) {
    return '오늘은 여기서 끝낼 수도 있어요.'
  }
  if (result === 'lose') {
    return '연승 기록은 오늘 결과로 갱신돼요.'
  }
  if (result === 'draw') {
    return '무승부도 오늘의 기록이에요.'
  }
  return '짧은 동영상 시청 후 오늘 마지막으로 한 번 더 굴릴 수 있어요.'
}

export default function RematchButton({
  hasRematch,
  result,
  loseStreak,
}: RematchButtonProps) {
  const router = useRouter()
  const [adLoading, setAdLoading] = useState(false)
  const [adError, setAdError] = useState<string | null>(null)

  if (hasRematch) return null

  async function handleClick() {
    setAdLoading(true)
    setAdError(null)
    try {
      const rewarded = await watchAd()
      if (!rewarded) {
        setAdError('광고를 끝까지 시청해야 재도전 기회를 얻을 수 있어요.')
        return
      }
      // 광고 시청 완료 → 재대결 플레이 화면으로 이동
      router.push('/play/rematch')
    } catch {
      setAdError('광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setAdLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="secondary"
        fullWidth
        onClick={handleClick}
        disabled={adLoading}
      >
        {adLoading ? '광고 불러오는 중...' : '오늘 한 번 더 굴려볼게요'}
      </Button>
      {adError && (
        <p className="text-xs text-red-500 text-center px-4">{adError}</p>
      )}
      <p className="text-xs text-gray-400 text-center leading-relaxed px-4">
        {rematchHint(result, loseStreak)}
        <br />
        단, 이 결과가 오늘의 최종 기록이 됩니다.
      </p>
    </div>
  )
}
