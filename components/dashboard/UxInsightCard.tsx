'use client'

import MetricTooltip from './MetricTooltip'

interface UxInsightCardProps {
  label: string
  rate: number
  sessions: number
  tooltip: string
  thresholds: [number, number] // [greenMax, yellowMax]
  isExpanded: boolean
  onClick: () => void
}

function getStatusColor(rate: number, thresholds: [number, number]): string {
  if (rate <= thresholds[0]) return 'var(--color-positive)'
  if (rate <= thresholds[1]) return 'var(--color-warning)'
  return 'var(--color-negative)'
}

export default function UxInsightCard({
  label,
  rate,
  sessions,
  tooltip,
  thresholds,
  isExpanded,
  onClick,
}: UxInsightCardProps) {
  const color = getStatusColor(rate, thresholds)

  return (
    <button
      onClick={onClick}
      className={`text-left w-full px-3 sm:px-4 py-3 rounded-lg transition-colors hover:bg-bg-hover ${
        isExpanded ? 'bg-bg-hover ring-1 ring-border' : ''
      }`}
    >
      <p className="stat-label mb-1 sm:mb-1.5 flex items-center gap-1 text-[11px] sm:text-[13px]">
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        {label}
        <MetricTooltip text={tooltip} />
      </p>
      <p className="stat-value text-xl sm:text-[28px]" style={{ color }}>{rate.toFixed(2)}%</p>
      <p className="text-xs text-text-tertiary mt-1">
        {sessions} {sessions === 1 ? 'session' : 'sessions'}
      </p>
    </button>
  )
}
