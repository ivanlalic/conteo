'use client'

interface StatCardProps {
  label: string
  value: string
  delta?: number | null
  deltaLabel?: string
}

export default function StatCard({ label, value, delta, deltaLabel }: StatCardProps) {
  const isPositive = delta !== null && delta !== undefined && delta >= 0
  const showDelta = delta !== null && delta !== undefined && !isNaN(delta)

  return (
    <div className="flex-1 min-w-0 px-4 py-3 rounded-lg transition-colors hover:bg-bg-hover">
      <p className="stat-label mb-1.5">{label}</p>
      <p className="stat-value">{value}</p>
      {showDelta && (
        <p className={`stat-delta mt-1 ${isPositive ? 'text-positive' : 'text-negative'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(0)}%
          {deltaLabel && <span className="text-text-tertiary ml-1">{deltaLabel}</span>}
        </p>
      )}
    </div>
  )
}
