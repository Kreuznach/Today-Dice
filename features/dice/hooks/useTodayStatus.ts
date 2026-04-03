'use client'

import { useState, useEffect, useCallback } from 'react'
import { getOrCreateGuestId } from '@/lib/auth'
import type { TodayStatusResponse } from '@/types'

export function useTodayStatus() {
  const [data, setData] = useState<TodayStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const userId = getOrCreateGuestId()
      const res = await window.fetch('/api/today-status', {
        headers: { Authorization: `Bearer ${userId}` },
      })
      if (!res.ok) throw new Error('상태 조회 실패')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}
