'use client'

import { useEffect, useRef } from 'react'
import DiceFace from './DiceFace'

interface DiceRollAnimationProps {
  onComplete: () => void
}

const ROLL_SEQUENCE = [1, 3, 5, 2, 6, 4, 1, 5, 3, 6, 2, 4] as const

export default function DiceRollAnimation({ onComplete }: DiceRollAnimationProps) {
  const indexRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const totalFrames = ROLL_SEQUENCE.length
    let frame = 0
    const interval = 80 // ms

    timerRef.current = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % ROLL_SEQUENCE.length
      frame++
      if (frame >= totalFrames) {
        clearInterval(timerRef.current!)
        setTimeout(onComplete, 100)
      }
    }, interval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [onComplete])

  const current = ROLL_SEQUENCE[indexRef.current] as 1 | 2 | 3 | 4 | 5 | 6

  return (
    <div className="animate-bounce">
      <DiceFace value={current} size={96} />
    </div>
  )
}
