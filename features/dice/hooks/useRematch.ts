'use client'

import { useState } from 'react'
import { getOrCreateGuestId } from '@/lib/auth'
import { saveRematch } from '@/lib/supabase'
import type { RematchResponse } from '@/types'

export function useRematch() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function rematch(): Promise<RematchResponse | null> {
    setLoading(true)
    setError(null)
    try {
      const userId = getOrCreateGuestId()
      return await saveRematch(userId)
    } catch (e) {
      setError(e instanceof Error ? e.message : '재대결 요청 실패')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { rematch, loading, error }
}
