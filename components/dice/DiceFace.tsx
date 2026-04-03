interface DiceFaceProps {
  value: 1 | 2 | 3 | 4 | 5 | 6 | 'unknown'
  size?: number
}

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [25, 25],
    [75, 75],
  ],
  3: [
    [25, 25],
    [50, 50],
    [75, 75],
  ],
  4: [
    [25, 25],
    [75, 25],
    [25, 75],
    [75, 75],
  ],
  5: [
    [25, 25],
    [75, 25],
    [50, 50],
    [25, 75],
    [75, 75],
  ],
  6: [
    [25, 20],
    [75, 20],
    [25, 50],
    [75, 50],
    [25, 80],
    [75, 80],
  ],
}

export default function DiceFace({ value, size = 80 }: DiceFaceProps) {
  if (value === 'unknown') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="주사위"
      >
        <rect x="2" y="2" width="96" height="96" rx="16" ry="16" fill="white" stroke="#e5e7eb" strokeWidth="3" />
        <text x="50" y="58" textAnchor="middle" fontSize="36" fill="#9ca3af">?</text>
      </svg>
    )
  }

  const dots = DOT_POSITIONS[value] ?? []

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`주사위 ${value}`}
    >
      <rect x="2" y="2" width="96" height="96" rx="16" ry="16" fill="white" stroke="#e5e7eb" strokeWidth="3" />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="7" fill="#1f2937" />
      ))}
    </svg>
  )
}
