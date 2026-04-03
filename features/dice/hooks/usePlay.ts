'use client'

import { useState } from 'react'
import { getOrCreateGuestId } from '@/lib/auth'
import type { PlayResponse } from '@/types'

export function usePlay() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function play(): Promise<PlayResponse | null> {
    setLoading(true)
    setError(null)
    try {
      const userId = getOrCreateGuestId()
      const res = await fetch('/api/play', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userId}` },
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '플레이 요청 실패')
        return null
      }
      return json as PlayResponse
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { play, loading, error }
}
