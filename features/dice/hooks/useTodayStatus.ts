'use client'

import { useState, useEffect, useCallback } from 'react'
import { getOrCreateGuestId } from '@/lib/auth'
import { getTodayStatus } from '@/lib/supabase'
import type { TodayStatusResponse } from '@/types'

export function useTodayStatus() {
  const [data, setData] = useState<TodayStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const userId = getOrCreateGuestId()
      const result = await getTodayStatus(userId)
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}
