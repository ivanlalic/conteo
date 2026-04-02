'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useTheme } from '@/components/ThemeProvider'
import type { TimePeriod } from '@/components/dashboard/DateRangePicker'
import type { ChartMetric } from '@/lib/chart-utils'
import { getGranularityForRange, formatBucketLabel, formatBucketTooltip, calcPercentChange } from '@/lib/chart-utils'

export interface TrendDataPoint {
  bucket: string
  pageviews: number
  unique_visitors: number
}

interface VisitorChartProps {
  data: TrendDataPoint[]
  comparisonData?: TrendDataPoint[]
  timePeriod: TimePeriod
  metric: ChartMetric
  showComparison: boolean
  onMetricChange: (metric: ChartMetric) => void
  onComparisonChange: (show: boolean) => void
}

export default function VisitorChart({
  data,
  comparisonData,
  timePeriod,
  metric,
  showComparison,
  onMetricChange,
  onComparisonChange,
}: VisitorChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const { labelFormat, tooltipFormat } = useMemo(
    () => getGranularityForRange(timePeriod),
    [timePeriod]
  )

  const colors = useMemo(
    () => ({
      stroke: isDark ? '#6366F1' : '#4F46E5',
      fillStart: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.15)',
      fillEnd: isDark ? 'rgba(99, 102, 241, 0)' : 'rgba(79, 70, 229, 0)',
      grid: isDark ? '#2D2D2D' : '#F3F4F6',
      text: isDark ? '#9CA3AF' : '#6B7280',
      tooltipBg: isDark ? '#1A1A1A' : '#FFFFFF',
      tooltipBorder: isDark ? '#2D2D2D' : '#E5E7EB',
      comparison: isDark ? '#6B7280' : '#9CA3AF',
    }),
    [isDark]
  )

  const dataKey = metric === 'visitors' ? 'unique_visitors' : 'pageviews'
  const prevDataKey = metric === 'visitors' ? 'prev_visitors' : 'prev_pageviews'
  const metricLabel = metric === 'visitors' ? 'Unique Visitors' : 'Pageviews'

  const mergedData = useMemo(() => {
    if (!data || data.length === 0) return []

    return data.map((point, i) => ({
      ...point,
      prev_visitors: showComparison && comparisonData ? (comparisonData[i]?.unique_visitors ?? 0) : undefined,
      prev_pageviews: showComparison && comparisonData ? (comparisonData[i]?.pageviews ?? 0) : undefined,
    }))
  }, [data, comparisonData, showComparison])

  if (!data || data.length === 0) {
    return (
      <div>
        <ChartHeader
          metric={metric}
          showComparison={showComparison}
          onMetricChange={onMetricChange}
          onComparisonChange={onComparisonChange}
        />
        <div className="h-64 flex items-center justify-center text-text-tertiary text-sm">
          No data for this period
        </div>
      </div>
    )
  }

  return (
    <div>
      <ChartHeader
        metric={metric}
        showComparison={showComparison}
        onMetricChange={onMetricChange}
        onComparisonChange={onComparisonChange}
      />

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mergedData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.fillStart} stopOpacity={1} />
                <stop offset="100%" stopColor={colors.fillEnd} stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="bucket"
              tickFormatter={(val) => formatBucketLabel(val, labelFormat)}
              tick={{ fontSize: 12, fill: colors.text }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 12, fill: colors.text }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const currentVal = payload[0]?.value as number
                const prevEntry = payload.find((p) => p.dataKey === prevDataKey)
                const prevVal = prevEntry?.value as number | undefined

                return (
                  <div
                    className="rounded-lg px-3 py-2 text-sm shadow-lg"
                    style={{
                      background: colors.tooltipBg,
                      border: `1px solid ${colors.tooltipBorder}`,
                    }}
                  >
                    <p className="font-medium text-text-primary mb-1">
                      {formatBucketTooltip(String(label), tooltipFormat)}
                    </p>
                    <p className="text-text-secondary">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{ background: colors.stroke }}
                      />
                      {currentVal?.toLocaleString()} {metricLabel.toLowerCase()}
                    </p>
                    {showComparison && prevVal !== undefined && (
                      <>
                        <p className="text-text-tertiary text-xs mt-0.5" style={{ color: colors.comparison }}>
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1.5"
                            style={{ background: colors.comparison }}
                          />
                          Previous: {prevVal.toLocaleString()}
                        </p>
                        {(() => {
                          const pct = calcPercentChange(currentVal, prevVal)
                          if (!pct) return null
                          const isPositive = pct.startsWith('+')
                          return (
                            <p className={`text-xs mt-1 font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {isPositive ? '↑' : '↓'} {pct.replace(/^[+-]/, '')} vs previous
                            </p>
                          )
                        })()}
                      </>
                    )}
                  </div>
                )
              }}
            />
            {showComparison && comparisonData && comparisonData.length > 0 && (
              <Area
                type="monotone"
                dataKey={prevDataKey}
                stroke={colors.comparison}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
                dot={false}
                isAnimationActive={false}
              />
            )}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={colors.stroke}
              strokeWidth={2}
              fill="url(#colorMetric)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Custom legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-text-tertiary">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 inline-block rounded" style={{ background: colors.stroke }} />
          Current period
        </span>
        {showComparison && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-4 h-0 inline-block"
              style={{ borderTop: `1.5px dashed ${colors.comparison}` }}
            />
            Previous period
          </span>
        )}
      </div>
    </div>
  )
}

function ChartHeader({
  metric,
  showComparison,
  onMetricChange,
  onComparisonChange,
}: {
  metric: ChartMetric
  showComparison: boolean
  onMetricChange: (m: ChartMetric) => void
  onComparisonChange: (show: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <select
        value={metric}
        onChange={(e) => onMetricChange(e.target.value as ChartMetric)}
        className="text-sm border border-border rounded-lg px-2.5 py-1.5 bg-bg-card text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="visitors">Unique Visitors</option>
        <option value="pageviews">Total Pageviews</option>
      </select>

      <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showComparison}
          onChange={(e) => onComparisonChange(e.target.checked)}
          className="rounded border-border text-primary focus:ring-primary"
        />
        Compare previous period
      </label>
    </div>
  )
}
