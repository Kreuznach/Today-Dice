'use client'

import { useEffect, useRef, useState } from 'react'

// 각 면(value)의 점 위치 (퍼센트)
const DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]],
}

// 면 배치 (CSS 3D 큐브 표준):
//   front(1)  : translateZ(+half)
//   back(6)   : rotateY(180deg) translateZ(+half)
//   right(3)  : rotateY(90deg)  translateZ(+half)
//   left(4)   : rotateY(-90deg) translateZ(+half)
//   top(5)    : rotateX(90deg)  translateZ(+half)  ← 위로 눕힌 면
//   bottom(2) : rotateX(-90deg) translateZ(+half)
//
// 큐브 전체를 회전시켜 해당 value가 앞으로 오게 만드는 회전:
const FACE_TARGET: Record<number, { rx: number; ry: number }> = {
  1: { rx: 0, ry: 0 },
  2: { rx: 90, ry: 0 },
  3: { rx: 0, ry: -90 },
  4: { rx: 0, ry: 90 },
  5: { rx: -90, ry: 0 },
  6: { rx: 0, ry: 180 },
}

/** 현재 각도 from에서 목표 각도 to로의 최단 경로 */
function nearestAngle(from: number, to: number): number {
  const diff = ((((to - from) % 360) + 540) % 360) - 180
  return from + diff
}

// ─── 면에 찍히는 점들 ──────────────────────────────────────────────

interface DotsProps {
  positions: [number, number][]
  dotRadius: number
}

function Dots({ positions, dotRadius }: DotsProps) {
  return (
    <>
      {positions.map(([cx, cy], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: dotRadius * 2,
            height: dotRadius * 2,
            borderRadius: '50%',
            backgroundColor: '#1e293b',
            left: `${cx}%`,
            top: `${cy}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
          }}
        />
      ))}
    </>
  )
}

// ─── 큐브의 한 면 ─────────────────────────────────────────────────

interface FaceProps {
  faceId: number
  transform: string
  size: number
  showUnknown?: boolean
}

function Face({ faceId, transform, size, showUnknown }: FaceProps) {
  const r = size * 0.16 // border-radius
  const dotRadius = size * 0.065

  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        transform,
        backfaceVisibility: 'visible',
        borderRadius: r,
        background: 'linear-gradient(145deg, #ffffff 0%, #eef2f7 100%)',
        border: '2px solid #cbd5e1',
        boxShadow:
          'inset 0 1px 3px rgba(255,255,255,0.9), inset 0 -1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {showUnknown ? (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.36,
            color: '#94a3b8',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          ?
        </span>
      ) : (
        <Dots positions={DOTS[faceId]} dotRadius={dotRadius} />
      )}
    </div>
  )
}

// ─── Dice3D ───────────────────────────────────────────────────────

interface Dice3DProps {
  value: 1 | 2 | 3 | 4 | 5 | 6 | 'unknown'
  size?: number
  rolling?: boolean
  label?: string
}

export default function Dice3D({
  value,
  size = 80,
  rolling = false,
  label,
}: Dice3DProps) {
  const half = size / 2

  const [rotX, setRotX] = useState(-10)
  const [rotY, setRotY] = useState(25)
  const [transition, setTransition] = useState('none')

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rotRef = useRef({ x: -10, y: 25 })

  useEffect(() => {
    if (rolling) {
      // 전환 없이 즉시 스핀 시작
      setTransition('none')
      rotRef.current = { x: rotRef.current.x, y: rotRef.current.y }

      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        rotRef.current.x += 90
        rotRef.current.y += 120
        setRotX(rotRef.current.x)
        setRotY(rotRef.current.y)
      }, 80)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      if (value === 'unknown') {
        // 초기 대기 상태: 약간 기울여서 3D 느낌
        setTransition('transform 0.5s ease-out')
        setRotX(-10)
        setRotY(25)
        rotRef.current = { x: -10, y: 25 }
      } else {
        // 최단 경로로 목표 면 회전
        const target = FACE_TARGET[value]
        const finalX = nearestAngle(rotRef.current.x, target.rx)
        const finalY = nearestAngle(rotRef.current.y, target.ry)
        rotRef.current = { x: finalX, y: finalY }
        setTransition('transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)')
        setRotX(finalX)
        setRotY(finalY)
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [rolling, value])

  const isUnknown = value === 'unknown'

  // 6개 면 정의 (faceId = 주사위 숫자)
  const faces = [
    { id: 1, t: `translateZ(${half}px)` },
    { id: 6, t: `rotateY(180deg) translateZ(${half}px)` },
    { id: 3, t: `rotateY(90deg) translateZ(${half}px)` },
    { id: 4, t: `rotateY(-90deg) translateZ(${half}px)` },
    { id: 5, t: `rotateX(90deg) translateZ(${half}px)` },
    { id: 2, t: `rotateX(-90deg) translateZ(${half}px)` },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {label && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      )}

      {/* perspective wrapper */}
      <div
        style={{
          perspective: `${size * 5}px`,
          perspectiveOrigin: '50% 50%',
          // 큐브 아래 그림자
          filter: rolling
            ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.18))'
            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))',
        }}
      >
        <div
          style={{
            width: size,
            height: size,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            transition,
          }}
        >
          {faces.map(({ id, t }) => (
            <Face
              key={id}
              faceId={id}
              transform={t}
              size={size}
              showUnknown={isUnknown}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
