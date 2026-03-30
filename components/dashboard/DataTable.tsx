'use client'

import { useState } from 'react'

interface Column {
  key: string
  label: string
  align?: 'left' | 'right'
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  title: string
  columns: Column[]
  data: any[]
  maxKey?: string
  showPercentBar?: boolean
  initialRows?: number
  onRowClick?: (row: any) => void
  emptyMessage?: string
}

export default function DataTable({
  title,
  columns,
  data,
  maxKey,
  showPercentBar = true,
  initialRows = 10,
  onRowClick,
  emptyMessage = 'No data yet',
}: DataTableProps) {
  const [showAll, setShowAll] = useState(false)
  const visibleData = showAll ? data : data.slice(0, initialRows)
  const hasMore = data.length > initialRows

  const maxValue = maxKey
    ? Math.max(...data.map((row) => Number(row[maxKey]) || 0), 1)
    : 0

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3">{title}</h3>
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
                  <tr
                    key={i}
                    className={`relative ${
                      onRowClick ? 'cursor-pointer hover:bg-bg-hover' : ''
                    }`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col, ci) => (
                      <td
                        key={col.key}
                        className={`py-2 pr-2 text-${col.align || 'left'} relative z-10`}
                      >
                        {ci === 0 && showPercentBar && maxKey && (
                          <div
                            className="percent-bar absolute inset-y-0 left-0 rounded-sm z-0"
                            style={{
                              width: `${((Number(row[maxKey]) || 0) / maxValue) * 100}%`,
                              background: 'var(--color-primary-medium)',
                            }}
                          />
                        )}
                        <span className="relative z-10">
                          {col.render ? col.render(row[col.key], row) : row[col.key]}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 text-sm text-primary hover:underline"
            >
              {showAll ? 'Show less' : `Show all ${data.length}`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
