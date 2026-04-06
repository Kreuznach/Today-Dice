'use client'

import { useState } from 'react'
import { getOrCreateGuestId } from '@/lib/auth'
import { saveRematch } from '@/lib/supabase'
import type { RematchResponse } from '@/types'

export function useRematch() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // adToken은 AIT 광고 검증용으로 유지 (현재는 클라이언트에서 직접 검증 없이 통과)
  async function rematch(_adToken: string): Promise<RematchResponse | null> {
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
