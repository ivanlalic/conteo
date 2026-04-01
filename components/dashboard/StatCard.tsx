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
    <div className="flex-1 min-w-0 px-4 py-3 rounded-lg transition-colors hover:bg-bg-hover">
      <p className="stat-label mb-1.5 flex items-center gap-0.5">
        {label}
        {tooltip && <MetricTooltip text={tooltip} />}
      </p>
      <p className="stat-value">{value}</p>
      {showDelta && (
        <p className={`stat-delta mt-1 ${isPositive ? 'text-positive' : 'text-negative'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(0)}%
        </p>
      )}
    </div>
  )
}
