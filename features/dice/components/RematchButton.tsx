'use client'

import { useEffect, useRef, useState } from 'react'
import { GoogleAdMob } from '@apps-in-toss/web-framework'
import Button from '@/components/ui/Button'

const AIT_AD_ID = process.env.NEXT_PUBLIC_AIT_AD_ID ?? 'ait.v2.live.544f01132f2a43ec'

interface RematchButtonProps {
  hasRematch: boolean
  onAdComplete: (adToken: string) => void
  loading?: boolean
}

export default function RematchButton({ hasRematch, onAdComplete, loading = false }: RematchButtonProps) {
  const [adLoaded, setAdLoaded] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (hasRematch) return
    if (GoogleAdMob.loadAppsInTossAdMob.isSupported() !== true) return

    const cleanup = GoogleAdMob.loadAppsInTossAdMob({
      options: { adGroupId: AIT_AD_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          setAdLoaded(true)
        }
      },
      onError: () => {
        // 광고 로드 실패 시 폴백(개발 환경)에서는 버튼 활성화
        setAdLoaded(true)
      },
    })
    cleanupRef.current = cleanup

    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [hasRematch])

  if (hasRematch) return null

  async function handleClick() {
    // AIT 광고 SDK가 지원되는 환경 (Toss 앱 내 WebView)
    if (GoogleAdMob.showAppsInTossAdMob.isSupported() === true) {
      GoogleAdMob.showAppsInTossAdMob({
        options: { adGroupId: AIT_AD_ID },
        onEvent: (event) => {
          if (event.type === 'userEarnedReward') {
            onAdComplete(`ait_reward_${AIT_AD_ID}_${Date.now()}`)
          }
        },
        onError: () => {
          // 광고 재생 실패 — 아무것도 하지 않음
        },
      })
    } else {
      // 개발 환경 또는 비-Toss 브라우저 폴백
      onAdComplete(`dev_ad_${Date.now()}`)
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
