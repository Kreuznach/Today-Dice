'use client'

import Button from '@/components/ui/Button'

interface RematchButtonProps {
  hasRematch: boolean
  onAdComplete: (adToken: string) => void
  loading?: boolean
}

export default function RematchButton({ hasRematch, onAdComplete, loading = false }: RematchButtonProps) {
  if (hasRematch) return null

  function handleClick() {
    // MVP: 광고 SDK 연동 전 임시 토큰으로 처리
    const mockAdToken = `mock_ad_${Date.now()}`
    onAdComplete(mockAdToken)
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
