'use client'

interface ScrollDepthMiniProps {
  pct25: number
  pct50: number
  pct75: number
  pct100: number
}

export default function ScrollDepthMini({ pct25, pct50, pct75, pct100 }: ScrollDepthMiniProps) {
  const bars = [
    { label: '25%', value: pct25 },
    { label: '50%', value: pct50 },
    { label: '75%', value: pct75 },
    { label: '100%', value: pct100 },
  ]

  function getColor(value: number): string {
    if (value > 60) return 'rgb(34, 197, 94)'
    if (value > 30) return 'rgb(234, 179, 8)'
    return 'rgb(239, 68, 68)'
  }

  return (
    <div className="flex items-end gap-0.5 h-5 group relative">
      {bars.map((bar) => (
        <div
          key={bar.label}
          className="w-1.5 rounded-sm transition-colors"
          style={{
            height: `${Math.max(bar.value, 5)}%`,
            backgroundColor: getColor(bar.value),
          }}
        />
      ))}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1.5 whitespace-nowrap shadow-lg">
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span className="text-gray-400">25%</span><span>{pct25}%</span>
            <span className="text-gray-400">50%</span><span>{pct50}%</span>
            <span className="text-gray-400">75%</span><span>{pct75}%</span>
            <span className="text-gray-400">100%</span><span>{pct100}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
