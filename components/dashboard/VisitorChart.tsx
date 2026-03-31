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

interface ChartDataPoint {
  date: string
  pageviews: number
  unique_visitors: number
}

interface VisitorChartProps {
  data: ChartDataPoint[]
  comparisonData?: ChartDataPoint[]
  periodLabel?: string
}

export default function VisitorChart({ data, comparisonData, periodLabel }: VisitorChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

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

  const mergedData = useMemo(() => {
    if (!comparisonData || comparisonData.length === 0) return data

    return data.map((point, i) => ({
      ...point,
      prev_visitors: comparisonData[i]?.unique_visitors ?? 0,
      prev_pageviews: comparisonData[i]?.pageviews ?? 0,
    }))
  }, [data, comparisonData])

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-text-tertiary text-sm">
        No data for this period
      </div>
    )
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function formatTooltipDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mergedData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.fillStart} stopOpacity={1} />
              <stop offset="100%" stopColor={colors.fillEnd} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
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
              return (
                <div
                  className="rounded-lg px-3 py-2 text-sm shadow-lg"
                  style={{
                    background: colors.tooltipBg,
                    border: `1px solid ${colors.tooltipBorder}`,
                  }}
                >
                  <p className="font-medium text-text-primary mb-1">{formatTooltipDate(String(label))}</p>
                  <p className="text-text-secondary">
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: colors.stroke }} />
                    {payload[0]?.value?.toLocaleString()} visitors
                  </p>
                  {payload[1] && (
                    <p className="text-text-tertiary text-xs mt-0.5">
                      {payload[1]?.value?.toLocaleString()} pageviews
                    </p>
                  )}
                  {payload[2] !== undefined && (payload as any)[2]?.value !== undefined && (
                    <p className="text-text-tertiary text-xs mt-0.5" style={{ color: colors.comparison }}>
                      Previous: {(payload as any)[2]?.value?.toLocaleString()} visitors
                    </p>
                  )}
                </div>
              )
            }}
          />
          {comparisonData && comparisonData.length > 0 && (
            <Area
              type="monotone"
              dataKey="prev_visitors"
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
            dataKey="unique_visitors"
            stroke={colors.stroke}
            strokeWidth={2}
            fill="url(#colorVisitors)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
