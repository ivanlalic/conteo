'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { getCountryFlag, getCountryName } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'

import StatCard from '@/components/dashboard/StatCard'
import RealtimeBadge from '@/components/dashboard/RealtimeBadge'
import DateRangePicker, { type TimePeriod } from '@/components/dashboard/DateRangePicker'
import VisitorChart from '@/components/dashboard/VisitorChart'
import DataTable from '@/components/dashboard/DataTable'

// --- Types ---

interface Site {
  id: string
  domain: string
  api_key: string
  cod_tracking_enabled: boolean
}

interface TopPage {
  path: string
  pageviews: number
  unique_visitors: number
  bounce_rate: number
}

interface ReferrerSource {
  source: string
  visits: number
  unique_visitors: number
}

interface ChartData {
  date: string
  pageviews: number
  unique_visitors: number
}

interface DeviceBreakdown {
  device: string
  pageviews: number
  unique_visitors: number
}

interface BrowserBreakdown {
  browser: string
  pageviews: number
  unique_visitors: number
}

interface TopCountry {
  country: string
  pageviews: number
  unique_visitors: number
}

// --- Helpers ---

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toLocaleString()
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function calcDelta(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null
  if (previous === 0) return 100
  return ((current - previous) / previous) * 100
}

function getPeriodDates(period: TimePeriod, customStart?: string, customEnd?: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let start: Date
  let end: Date = now

  switch (period) {
    case 'today':
      start = today
      break
    case '7d':
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '6m':
      start = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000)
      break
    case '12m':
      start = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    case 'custom':
      if (customStart && customEnd) {
        start = new Date(customStart + 'T00:00:00')
        end = new Date(customEnd + 'T23:59:59')
      } else {
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      }
      break
    default:
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  // Previous period (same duration, immediately before)
  const duration = end.getTime() - start.getTime()
  const prevEnd = new Date(start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - duration)

  return { start, end, prevStart, prevEnd }
}

function getSourceIcon(source: string): string {
  const s = source.toLowerCase()
  if (s.includes('google')) return '🔍'
  if (s.includes('facebook') || s.includes('fb.')) return '📘'
  if (s.includes('twitter') || s.includes('t.co') || s.includes('x.com')) return '𝕏'
  if (s.includes('instagram')) return '📷'
  if (s.includes('linkedin')) return '💼'
  if (s.includes('youtube')) return '📺'
  if (s.includes('reddit')) return '🤖'
  if (s.includes('tiktok')) return '🎵'
  if (s.includes('duckduckgo')) return '🦆'
  if (s === 'direct' || s === 'direct / none') return '⚡'
  return '🔗'
}

// --- Dashboard Content ---

function DashboardContent() {
  const { user, signOut } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Site state
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [loading, setLoading] = useState(true)

  // Period
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Data
  const [liveUsers, setLiveUsers] = useState(0)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [comparisonChartData, setComparisonChartData] = useState<ChartData[]>([])
  const [currentVisitors, setCurrentVisitors] = useState(0)
  const [currentPageviews, setCurrentPageviews] = useState(0)
  const [prevVisitors, setPrevVisitors] = useState(0)
  const [prevPageviews, setPrevPageviews] = useState(0)
  const [avgDuration, setAvgDuration] = useState(0)
  const [prevAvgDuration, setPrevAvgDuration] = useState(0)
  const [bounceRate, setBounceRate] = useState(0)
  const [prevBounceRate, setPrevBounceRate] = useState(0)

  // Tables
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [referrerSources, setReferrerSources] = useState<ReferrerSource[]>([])
  const [topCountries, setTopCountries] = useState<TopCountry[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([])
  const [browserBreakdown, setBrowserBreakdown] = useState<BrowserBreakdown[]>([])

  // Load sites on mount
  useEffect(() => {
    loadSites()
  }, [])

  // Load stats when site or period changes
  useEffect(() => {
    if (selectedSite) {
      loadAllData()
    }
  }, [selectedSite, timePeriod, customStartDate, customEndDate])

  // Refresh live users every 30 seconds
  useEffect(() => {
    if (!selectedSite) return
    const interval = setInterval(() => {
      supabase.rpc('get_live_users', { site_uuid: selectedSite.id }).then(({ data }) => {
        if (data !== null) setLiveUsers(data)
      })
    }, 30000)
    return () => clearInterval(interval)
  }, [selectedSite])

  async function loadSites() {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, domain, api_key, cod_tracking_enabled')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSites(data || [])
      if (data && data.length > 0) setSelectedSite(data[0])
      setLoading(false)
    } catch (error) {
      console.error('Error loading sites:', error)
      setLoading(false)
    }
  }

  async function loadAllData() {
    if (!selectedSite) return

    const { start, end, prevStart, prevEnd } = getPeriodDates(
      timePeriod,
      customStartDate,
      customEndDate
    )
    const tzOffset = -new Date().getTimezoneOffset()

    try {
      // All queries in parallel
      const [
        liveRes,
        chartRes,
        compChartRes,
        visitorsRes,
        prevVisitorsRes,
        pageviewsRes,
        prevPageviewsRes,
        durationRes,
        prevDurationRes,
        pagesRes,
        referrersRes,
        countriesRes,
        devicesRes,
        browsersRes,
      ] = await Promise.all([
        // Live users
        supabase.rpc('get_live_users', { site_uuid: selectedSite.id }),
        // Chart data (current)
        supabase.rpc('get_pageviews_chart', {
          site_uuid: selectedSite.id,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          tz_offset_minutes: tzOffset,
        }),
        // Chart data (comparison period)
        supabase.rpc('get_pageviews_chart', {
          site_uuid: selectedSite.id,
          start_date: prevStart.toISOString(),
          end_date: prevEnd.toISOString(),
          tz_offset_minutes: tzOffset,
        }),
        // Unique visitors (current)
        supabase.rpc('get_unique_visitors', {
          site_uuid: selectedSite.id,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        }),
        // Unique visitors (previous)
        supabase.rpc('get_unique_visitors', {
          site_uuid: selectedSite.id,
          start_date: prevStart.toISOString(),
          end_date: prevEnd.toISOString(),
        }),
        // Total pageviews (current)
        supabase
          .from('pageviews')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', selectedSite.id)
          .gte('timestamp', start.toISOString())
          .lte('timestamp', end.toISOString()),
        // Total pageviews (previous)
        supabase
          .from('pageviews')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', selectedSite.id)
          .gte('timestamp', prevStart.toISOString())
          .lte('timestamp', prevEnd.toISOString()),
        // Avg session duration (current)
        supabase.rpc('get_avg_session_duration', {
          site_uuid: selectedSite.id,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        }),
        // Avg session duration (previous)
        supabase.rpc('get_avg_session_duration', {
          site_uuid: selectedSite.id,
          start_date: prevStart.toISOString(),
          end_date: prevEnd.toISOString(),
        }),
        // Top pages
        supabase.rpc('get_top_pages_with_devices', {
          site_uuid: selectedSite.id,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          page_limit: 20,
        }),
        // Referrer sources
        supabase.rpc('get_referrer_sources', {
          site_uuid: selectedSite.id,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          source_limit: 20,
        }),
        // Top countries
        supabase.rpc('get_top_countries', {
          site_uuid: selectedSite.id,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          country_limit: 20,
        }),
        // Device breakdown
        supabase.rpc('get_device_breakdown', {
          site_uuid: selectedSite.id,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        }),
        // Browser breakdown
        supabase.rpc('get_browser_breakdown', {
          site_uuid: selectedSite.id,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        }),
      ])

      // Set live users
      setLiveUsers(liveRes.data || 0)

      // Set chart data
      setChartData(chartRes.data || [])
      setComparisonChartData(compChartRes.data || [])

      // Set aggregate stats
      setCurrentVisitors(visitorsRes.data || 0)
      setPrevVisitors(prevVisitorsRes.data || 0)
      setCurrentPageviews(pageviewsRes.count || 0)
      setPrevPageviews(prevPageviewsRes.count || 0)

      const durData = durationRes.data?.[0] || { avg_duration_all: 0 }
      const prevDurData = prevDurationRes.data?.[0] || { avg_duration_all: 0 }
      setAvgDuration(durData.avg_duration_all || 0)
      setPrevAvgDuration(prevDurData.avg_duration_all || 0)

      // Calculate bounce rate from top pages data
      const pages = pagesRes.data || []
      if (pages.length > 0) {
        const totalViews = pages.reduce((sum: number, p: TopPage) => sum + p.pageviews, 0)
        const weightedBounce = pages.reduce(
          (sum: number, p: TopPage) => sum + (p.bounce_rate || 0) * p.pageviews,
          0
        )
        setBounceRate(totalViews > 0 ? weightedBounce / totalViews : 0)
      } else {
        setBounceRate(0)
      }
      setPrevBounceRate(0) // We don't query previous bounce rate for simplicity

      // Set table data
      setTopPages(pages)
      setReferrerSources(referrersRes.data || [])
      setTopCountries(countriesRes.data || [])
      setDeviceBreakdown(devicesRes.data || [])
      setBrowserBreakdown(browsersRes.data || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  // Computed
  const viewsPerVisit = useMemo(() => {
    if (currentVisitors === 0) return 0
    return currentPageviews / currentVisitors
  }, [currentPageviews, currentVisitors])

  const prevViewsPerVisit = useMemo(() => {
    if (prevVisitors === 0) return 0
    return prevPageviews / prevVisitors
  }, [prevPageviews, prevVisitors])

  // Total visitors for tables
  const totalVisitors = useMemo(() => {
    return Math.max(currentVisitors, 1)
  }, [currentVisitors])

  // --- Render ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="text-text-tertiary text-sm">Loading...</div>
      </div>
    )
  }

  if (sites.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="text-center max-w-sm">
          <p className="text-text-primary text-lg font-semibold mb-2">No sites yet</p>
          <p className="text-text-secondary text-sm mb-4">
            Add your first site to start tracking analytics.
          </p>
          <Link
            href="/sites"
            className="inline-block px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Add a site
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: site selector + realtime */}
          <div className="flex items-center gap-4 min-w-0">
            {sites.length === 1 ? (
              <span className="text-sm font-semibold text-text-primary truncate">
                {selectedSite?.domain}
              </span>
            ) : (
              <select
                value={selectedSite?.id || ''}
                onChange={(e) => {
                  const site = sites.find((s) => s.id === e.target.value)
                  if (site) setSelectedSite(site)
                }}
                className="text-sm font-semibold text-text-primary bg-transparent border-none outline-none cursor-pointer pr-6 truncate"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.domain}
                  </option>
                ))}
              </select>
            )}
            <RealtimeBadge count={liveUsers} />
          </div>

          {/* Right: date picker + actions */}
          <div className="flex items-center gap-3">
            <DateRangePicker
              value={timePeriod}
              onChange={setTimePeriod}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomStartChange={setCustomStartDate}
              onCustomEndChange={setCustomEndDate}
            />

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
              title="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1A.5.5 0 018 1zm3.354 2.354a.5.5 0 010 .707l-.708.708a.5.5 0 11-.707-.708l.708-.707a.5.5 0 01.707 0zM14 7.5a.5.5 0 010 1h-1a.5.5 0 010-1h1zm-1.646 3.854a.5.5 0 010-.707l.708-.708a.5.5 0 01.707.708l-.708.707a.5.5 0 01-.707 0zM8 13a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1A.5.5 0 018 13zm-3.354-2.354a.5.5 0 010-.707l.708-.708a.5.5 0 11.707.708l-.708.707a.5.5 0 01-.707 0zM3 7.5a.5.5 0 010 1H2a.5.5 0 010-1h1zm.646-3.146a.5.5 0 01.707 0l.708.707a.5.5 0 11-.708.708L3.646 5.06a.5.5 0 010-.707zM8 5a3 3 0 100 6 3 3 0 000-6z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 .278a.768.768 0 01.08.858 7.208 7.208 0 00-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 01.81.316.733.733 0 01-.031.893A8.349 8.349 0 018.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 016 .278z"/></svg>
              )}
            </button>

            {/* Settings link */}
            <Link
              href="/sites"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Sites
            </Link>

            <button
              onClick={signOut}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stat cards row */}
        <section className="flex flex-wrap gap-0 -mx-4 sm:mx-0">
          <StatCard
            label="Unique visitors"
            value={formatNumber(currentVisitors)}
            delta={calcDelta(currentVisitors, prevVisitors)}
          />
          <StatCard
            label="Total pageviews"
            value={formatNumber(currentPageviews)}
            delta={calcDelta(currentPageviews, prevPageviews)}
          />
          <StatCard
            label="Bounce rate"
            value={bounceRate > 0 ? `${Math.round(bounceRate)}%` : '--'}
            delta={prevBounceRate > 0 ? calcDelta(bounceRate, prevBounceRate) : null}
          />
          <StatCard
            label="Visit duration"
            value={formatDuration(avgDuration)}
            delta={calcDelta(avgDuration, prevAvgDuration)}
          />
          <StatCard
            label="Views / visit"
            value={viewsPerVisit > 0 ? viewsPerVisit.toFixed(1) : '--'}
            delta={calcDelta(viewsPerVisit, prevViewsPerVisit)}
          />
        </section>

        {/* Area chart */}
        <section className="border border-border rounded-lg bg-bg-card p-4">
          <VisitorChart
            data={chartData}
            comparisonData={comparisonChartData}
          />
        </section>

        {/* Top pages + Top sources (2 cols) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Top pages"
              columns={[
                {
                  key: 'path',
                  label: 'Page',
                  render: (val: string) => (
                    <span className="truncate block max-w-[250px]" title={val}>
                      {val}
                    </span>
                  ),
                },
                { key: 'unique_visitors', label: 'Visitors', align: 'right' },
                {
                  key: 'pageviews',
                  label: 'Views',
                  align: 'right',
                  render: (val: number) => formatNumber(val),
                },
              ]}
              data={topPages}
              maxKey="unique_visitors"
              emptyMessage="No pageviews yet"
            />
          </div>

          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Top sources"
              columns={[
                {
                  key: 'source',
                  label: 'Source',
                  render: (val: string) => (
                    <span className="flex items-center gap-1.5">
                      <span>{getSourceIcon(val)}</span>
                      <span className="truncate">{val}</span>
                    </span>
                  ),
                },
                { key: 'unique_visitors', label: 'Visitors', align: 'right' },
                {
                  key: '_percent',
                  label: '%',
                  align: 'right',
                  render: (_: any, row: ReferrerSource) =>
                    `${totalVisitors > 0 ? Math.round((row.unique_visitors / totalVisitors) * 100) : 0}%`,
                },
              ]}
              data={referrerSources}
              maxKey="unique_visitors"
              emptyMessage="No referrers yet"
            />
          </div>
        </section>

        {/* Countries + Devices (2 cols) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Countries"
              columns={[
                {
                  key: 'country',
                  label: 'Country',
                  render: (val: string) => (
                    <span className="flex items-center gap-1.5">
                      <span>{getCountryFlag(val)}</span>
                      <span>{getCountryName(val) || val}</span>
                    </span>
                  ),
                },
                { key: 'unique_visitors', label: 'Visitors', align: 'right' },
                {
                  key: '_percent',
                  label: '%',
                  align: 'right',
                  render: (_: any, row: TopCountry) =>
                    `${totalVisitors > 0 ? Math.round((row.unique_visitors / totalVisitors) * 100) : 0}%`,
                },
              ]}
              data={topCountries}
              maxKey="unique_visitors"
              emptyMessage="No country data yet"
            />
          </div>

          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Devices"
              columns={[
                { key: 'device', label: 'Device' },
                { key: 'unique_visitors', label: 'Visitors', align: 'right' },
                {
                  key: '_percent',
                  label: '%',
                  align: 'right',
                  render: (_: any, row: DeviceBreakdown) => {
                    const total = deviceBreakdown.reduce((s, d) => s + d.unique_visitors, 0)
                    return `${total > 0 ? Math.round((row.unique_visitors / total) * 100) : 0}%`
                  },
                },
              ]}
              data={deviceBreakdown}
              maxKey="unique_visitors"
              emptyMessage="No device data yet"
            />
          </div>
        </section>

        {/* Browsers + OS (2 cols) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Browsers"
              columns={[
                { key: 'browser', label: 'Browser' },
                { key: 'unique_visitors', label: 'Visitors', align: 'right' },
                {
                  key: '_percent',
                  label: '%',
                  align: 'right',
                  render: (_: any, row: BrowserBreakdown) => {
                    const total = browserBreakdown.reduce((s, b) => s + b.unique_visitors, 0)
                    return `${total > 0 ? Math.round((row.unique_visitors / total) * 100) : 0}%`
                  },
                },
              ]}
              data={browserBreakdown}
              maxKey="unique_visitors"
              emptyMessage="No browser data yet"
            />
          </div>

          {/* OS - derived from browser breakdown since we don't have a separate RPC,
              or we show the device breakdown again. For now, show a placeholder
              that explains OS data isn't separately tracked */}
          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Operating systems"
              columns={[
                { key: 'device', label: 'OS' },
                { key: 'unique_visitors', label: 'Visitors', align: 'right' },
                {
                  key: '_percent',
                  label: '%',
                  align: 'right',
                  render: (_: any, row: DeviceBreakdown) => {
                    const total = deviceBreakdown.reduce((s, d) => s + d.unique_visitors, 0)
                    return `${total > 0 ? Math.round((row.unique_visitors / total) * 100) : 0}%`
                  },
                },
              ]}
              data={deviceBreakdown}
              maxKey="unique_visitors"
              emptyMessage="No OS data yet"
            />
          </div>
        </section>
      </main>
    </div>
  )
}

// --- Page export ---

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
