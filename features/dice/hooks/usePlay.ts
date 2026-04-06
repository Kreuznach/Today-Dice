'use client'

import { useState } from 'react'
import { getOrCreateGuestId } from '@/lib/auth'
import { savePlay } from '@/lib/supabase'
import type { PlayResponse } from '@/types'

export function usePlay() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function play(): Promise<PlayResponse | null> {
    setLoading(true)
    setError(null)
    try {
      const userId = getOrCreateGuestId()
      return await savePlay(userId)
    } catch (e) {
      setError(e instanceof Error ? e.message : '플레이 요청 실패')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { play, loading, error }
}
