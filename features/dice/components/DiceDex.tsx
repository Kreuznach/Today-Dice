interface DiceDexProps {
  counts: number[]
}

export default function DiceDex({ counts }: DiceDexProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500">눈 도감 · 한 번이라도 나오면 찍혀요</p>
      <div className="grid grid-cols-6 gap-1.5">
        {counts.map((count, index) => {
          const face = index + 1
          const found = count > 0
          return (
            <div
              key={face}
              className={[
                'flex flex-col items-center rounded-xl py-2 text-sm font-bold',
                found ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-300',
              ].join(' ')}
            >
              <span>{found ? face : '?'}</span>
              <span className="text-[10px] font-normal">{found ? `${count}회` : '미발견'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
