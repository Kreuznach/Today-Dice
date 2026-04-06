'use client'

import Button from '@/components/ui/Button'

// app-in-toss 광고 SDK: Toss WebView 환경에서 주입되는 전역 브릿지
declare global {
  interface Window {
    TossAdSDK?: {
      requestRewardedAd: (adId: string) => Promise<{ token: string }>
    }
  }
}

const AIT_AD_ID = process.env.NEXT_PUBLIC_AIT_AD_ID ?? 'ait.v2.live.544f01132f2a43ec'

interface RematchButtonProps {
  hasRematch: boolean
  onAdComplete: (adToken: string) => void
  loading?: boolean
}

export default function RematchButton({ hasRematch, onAdComplete, loading = false }: RematchButtonProps) {
  if (hasRematch) return null

  async function handleClick() {
    try {
      if (typeof window !== 'undefined' && window.TossAdSDK?.requestRewardedAd) {
        // app-in-toss 광고 SDK 연동
        const { token } = await window.TossAdSDK.requestRewardedAd(AIT_AD_ID)
        onAdComplete(token)
      } else {
        // 개발 환경 또는 비-Toss 브라우저 폴백
        const devToken = `dev_ad_${Date.now()}`
        onAdComplete(devToken)
      }
    } catch {
      // 광고 시청 취소 또는 실패 시 아무것도 하지 않음
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="secondary"
        fullWidth
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? '처리 중...' : '오늘 한 번 더 굴려볼게요'}
      </Button>
      <p className="text-xs text-gray-400 text-center leading-relaxed px-4">
        짧은 동영상 시청 후 오늘 마지막으로 한 번 더 굴릴 수 있어요.<br />
        단, 이 결과가 오늘의 최종 기록이 됩니다.
      </p>
    </div>
  )
}
