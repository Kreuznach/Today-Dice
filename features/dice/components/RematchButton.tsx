'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { watchAd } from '@/lib/ads'

interface RematchButtonProps {
  hasRematch: boolean
}

/**
 * 재대결 버튼 — 광고 시청 후 /play/rematch 로 이동
 *
 * 플로우: [버튼 클릭] → [광고 시청] → /play/rematch → 주사위 애니메이션 → /result/final
 */
export default function RematchButton({ hasRematch }: RematchButtonProps) {
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
        짧은 동영상 시청 후 오늘 마지막으로 한 번 더 굴릴 수 있어요.<br />
        단, 이 결과가 오늘의 최종 기록이 됩니다.
      </p>
    </div>
  )
}
