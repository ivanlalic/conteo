'use client'

import { useEffect, useCallback } from 'react'

export type TimePeriod = 'today' | '7d' | '30d' | '6m' | '12m' | 'custom'

interface DateRangePickerProps {
  value: TimePeriod
  onChange: (period: TimePeriod) => void
  customStartDate?: string
  customEndDate?: string
  onCustomStartChange?: (date: string) => void
  onCustomEndChange?: (date: string) => void
}

const PERIODS: { key: TimePeriod; label: string; shortcut: string }[] = [
  { key: 'today', label: 'Today', shortcut: 'T' },
  { key: '7d', label: '7d', shortcut: 'W' },
  { key: '30d', label: '30d', shortcut: 'M' },
  { key: '6m', label: '6m', shortcut: 'Q' },
  { key: '12m', label: '12m', shortcut: 'Y' },
]

export default function DateRangePicker({
  value,
  onChange,
  customStartDate,
  customEndDate,
  onCustomStartChange,
  onCustomEndChange,
}: DateRangePickerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const key = e.key.toUpperCase()
      const match = PERIODS.find((p) => p.shortcut === key)
      if (match) {
        e.preventDefault()
        onChange(match.key)
      }
    },
    [onChange]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center bg-bg-card border border-border rounded-lg overflow-hidden">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
              value === p.key
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value === 'custom' && onCustomStartChange && onCustomEndChange && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={customStartDate || ''}
            onChange={(e) => onCustomStartChange(e.target.value)}
            className="px-2 py-1.5 text-sm border border-border rounded-lg bg-bg-card text-text-primary"
          />
          <span className="text-text-tertiary text-sm">to</span>
          <input
            type="date"
            value={customEndDate || ''}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="px-2 py-1.5 text-sm border border-border rounded-lg bg-bg-card text-text-primary"
          />
        </div>
      )}
    </div>
  )
}
