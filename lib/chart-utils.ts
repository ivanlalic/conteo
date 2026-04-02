import type { TimePeriod } from '@/components/dashboard/DateRangePicker'

export type Granularity = 'hour' | 'day' | 'week' | 'month'
export type ChartMetric = 'visitors' | 'pageviews'

interface GranularityConfig {
  granularity: Granularity
  labelFormat: Intl.DateTimeFormatOptions
  tooltipFormat: Intl.DateTimeFormatOptions
}

const GRANULARITY_MAP: Record<string, GranularityConfig> = {
  today: {
    granularity: 'hour',
    labelFormat: { hour: '2-digit', minute: '2-digit' },
    tooltipFormat: { hour: '2-digit', minute: '2-digit' },
  },
  '7d': {
    granularity: 'day',
    labelFormat: { weekday: 'short', day: 'numeric' },
    tooltipFormat: { weekday: 'long', day: 'numeric', month: 'short' },
  },
  '30d': {
    granularity: 'day',
    labelFormat: { day: 'numeric', month: 'short' },
    tooltipFormat: { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' },
  },
  '6m': {
    granularity: 'week',
    labelFormat: { day: 'numeric', month: 'short' },
    tooltipFormat: { day: 'numeric', month: 'short', year: 'numeric' },
  },
  '12m': {
    granularity: 'month',
    labelFormat: { month: 'short', year: 'numeric' },
    tooltipFormat: { month: 'long', year: 'numeric' },
  },
}

const DEFAULT_CONFIG: GranularityConfig = {
  granularity: 'day',
  labelFormat: { day: 'numeric', month: 'short' },
  tooltipFormat: { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' },
}

export function getGranularityForRange(range: TimePeriod): GranularityConfig {
  return GRANULARITY_MAP[range] || DEFAULT_CONFIG
}

export function formatBucketLabel(bucket: string, format: Intl.DateTimeFormatOptions): string {
  const d = new Date(bucket)
  return d.toLocaleString('en-US', format)
}

export function formatBucketTooltip(bucket: string, format: Intl.DateTimeFormatOptions): string {
  const d = new Date(bucket)
  return d.toLocaleString('en-US', format)
}

export function calcPercentChange(current: number, previous: number): string | null {
  if (previous === 0 && current === 0) return null
  if (previous === 0) return current > 0 ? '+∞' : '0%'
  const change = ((current - previous) / previous) * 100
  const sign = change >= 0 ? '+' : ''
  return `${sign}${Math.round(change)}%`
}
