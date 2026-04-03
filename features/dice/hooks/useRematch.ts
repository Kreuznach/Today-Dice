'use client'

import { useState } from 'react'
import { getOrCreateGuestId } from '@/lib/auth'
import type { RematchResponse } from '@/types'

export function useRematch() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function rematch(adToken: string): Promise<RematchResponse | null> {
    setLoading(true)
    setError(null)
    try {
      const userId = getOrCreateGuestId()
      const res = await fetch('/api/rematch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ad_token: adToken }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '재대결 요청 실패')
        return null
      }
      return json as RematchResponse
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { rematch, loading, error }
}
