'use client'

import { useEffect, useState } from 'react'
import { formatCountdown, getMsUntilNextMidnightKST } from '@/lib/date-utils'

export default function MidnightCountdown() {
  const [ms, setMs] = useState(() => getMsUntilNextMidnightKST())

  useEffect(() => {
    const tick = () => setMs(getMsUntilNextMidnightKST())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <p className="text-center text-sm text-gray-600">
      내일 주사위까지{' '}
      <span className="font-semibold tabular-nums text-gray-800">
        {formatCountdown(ms)}
      </span>
    </p>
  )
}
