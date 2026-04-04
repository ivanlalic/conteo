'use client'

import MetricTooltip from './MetricTooltip'

interface StatCardProps {
  label: string
  value: string
  delta?: number | null
  tooltip?: string
}

export default function StatCard({ label, value, delta, tooltip }: StatCardProps) {
  const isPositive = delta !== null && delta !== undefined && delta >= 0
  const showDelta = delta !== null && delta !== undefined && !isNaN(delta)

  return (
    <div className="min-w-0 px-3 sm:px-4 py-3 rounded-lg transition-colors hover:bg-bg-hover">
      <p className="stat-label mb-1 sm:mb-1.5 flex items-center gap-0.5 text-[11px] sm:text-[13px]">
        {label}
        {tooltip && <MetricTooltip text={tooltip} />}
      </p>
      <p className="stat-value text-xl sm:text-[28px]">{value}</p>
      {showDelta && (
        <p className={`stat-delta mt-1 ${isPositive ? 'text-positive' : 'text-negative'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(0)}%
        </p>
      )}
    </div>
  )
}
