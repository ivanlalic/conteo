'use client'

import { useState, useEffect, useRef } from 'react'
import MetricTooltip from './MetricTooltip'

interface Column {
  key: string
  label: string
  align?: 'left' | 'right'
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  title: string
  tooltip?: string
  columns: Column[]
  data: any[]
  maxKey?: string
  showPercentBar?: boolean
  initialRows?: number
  onRowClick?: (row: any) => void
  emptyMessage?: string
  expandedKey?: string
  expandedContent?: (row: any) => React.ReactNode
}

function PercentBar({ value, max }: { value: number; max: number }) {
  const [width, setWidth] = useState(0)
  const pct = max > 0 ? (value / max) * 100 : 0

  useEffect(() => {
    // Trigger animation after mount
    const raf = requestAnimationFrame(() => setWidth(pct))
    return () => cancelAnimationFrame(raf)
  }, [pct])

  return (
    <div
      className="absolute inset-y-0 left-0 rounded-sm transition-all duration-[400ms] ease-out group-hover:opacity-[0.18]"
      style={{
        width: `${width}%`,
        background: 'var(--color-primary)',
        opacity: 0.08,
      }}
    />
  )
}

export default function DataTable({
  title,
  tooltip,
  columns,
  data,
  maxKey,
  showPercentBar = true,
  initialRows = 5,
  onRowClick,
  emptyMessage = 'No data yet',
  expandedKey,
  expandedContent,
}: DataTableProps) {
  const [visibleCount, setVisibleCount] = useState(initialRows)
  const visibleData = data.slice(0, visibleCount)
  const hasMore = visibleCount < data.length
  const isExpanded = visibleCount > initialRows

  const maxValue = maxKey
    ? Math.max(...data.map((row) => Number(row[maxKey]) || 0), 1)
    : 0

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center">
        {title}
        {tooltip && <MetricTooltip text={tooltip} />}
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-text-tertiary py-4">{emptyMessage}</p>
      ) : (
        <>
          <div className="data-table">
            <table className="w-full">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`pb-2 text-${col.align || 'left'} pr-2`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleData.map((row, i) => (
                  <>
                    <tr
                      key={i}
                      className={`group relative ${
                        onRowClick ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => onRowClick?.(row)}
                    >
                      {columns.map((col, ci) => (
                        <td
                          key={col.key}
                          className={`py-2 pr-2 text-${col.align || 'left'} relative`}
                        >
                          {ci === 0 && showPercentBar && maxKey && (
                            <PercentBar value={Number(row[maxKey]) || 0} max={maxValue} />
                          )}
                          <span className="relative z-10">
                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                          </span>
                        </td>
                      ))}
                    </tr>
                    {expandedKey && expandedContent && row[expandedKey] && (
                      <tr key={`expanded-${i}`}>
                        <td colSpan={columns.length} className="pb-2">
                          {expandedContent(row)}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex gap-3">
            {hasMore && (
              <button
                onClick={() => setVisibleCount((c) => Math.min(c + initialRows, data.length))}
                className="text-sm text-primary hover:underline"
              >
                Load more ({Math.min(initialRows, data.length - visibleCount)})
              </button>
            )}
            {isExpanded && (
              <button
                onClick={() => setVisibleCount(initialRows)}
                className="text-sm text-text-tertiary hover:underline"
              >
                Show less
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
