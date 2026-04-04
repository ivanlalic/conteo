'use client'

interface ScrollDepthMiniProps {
  pct25: number
  pct50: number
  pct75: number
  pct100: number
}

export default function ScrollDepthMini({ pct25, pct50, pct75, pct100 }: ScrollDepthMiniProps) {
  // If no meaningful scroll data, show nothing
  if (pct25 === 0 && pct50 === 0 && pct75 === 0 && pct100 === 0) {
    return <span className="text-text-tertiary text-xs">—</span>
  }

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
    <div className="inline-flex items-end gap-[3px] h-[20px] group relative cursor-default">
      {bars.map((bar) => (
        <div
          key={bar.label}
          className="w-[4px] rounded-sm"
          style={{
            height: `${Math.max(bar.value, 10)}%`,
            backgroundColor: getColor(bar.value),
          }}
        />
      ))}
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs rounded-md px-3 py-2 shadow-lg whitespace-nowrap">
          <div className="space-y-0.5">
            <div className="flex justify-between gap-4"><span className="text-gray-400">25%</span><span className="font-medium">{pct25}%</span></div>
            <div className="flex justify-between gap-4"><span className="text-gray-400">50%</span><span className="font-medium">{pct50}%</span></div>
            <div className="flex justify-between gap-4"><span className="text-gray-400">75%</span><span className="font-medium">{pct75}%</span></div>
            <div className="flex justify-between gap-4"><span className="text-gray-400">100%</span><span className="font-medium">{pct100}%</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
