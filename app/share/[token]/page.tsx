'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import VisitorChart, { type TrendDataPoint } from '@/components/dashboard/VisitorChart'
import StatCard from '@/components/dashboard/StatCard'
import DataTable from '@/components/dashboard/DataTable'
import DateRangePicker, { type TimePeriod } from '@/components/dashboard/DateRangePicker'
import ScrollDepthMini from '@/components/dashboard/ScrollDepthMini'
import { getCountryFlag, getCountryName } from '@/lib/utils'
import { getGranularityForRange, type ChartMetric } from '@/lib/chart-utils'
import Link from 'next/link'

interface TopPage {
  path: string
  pageviews: number
  unique_visitors: number
  bounce_rate: number
  pct_25?: number
  pct_50?: number
  pct_75?: number
  pct_100?: number
}

interface ReferrerSource {
  source: string
  visits: number
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

interface OSBreakdown {
  os: string
  pageviews: number
  unique_visitors: number
}

interface TopCountry {
  country: string
  pageviews: number
  unique_visitors: number
}

interface City {
  city: string
  pageviews: number
  unique_visitors: number
}

interface Campaign {
  utm_campaign: string
  utm_source: string
  utm_medium: string
  pageviews: number
  unique_visitors: number
}

function calcDelta(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null
  if (previous === 0) return 100
  return ((current - previous) / previous) * 100
}

function getPeriodDates(period: TimePeriod) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let start: Date
  const end: Date = now

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
    default:
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  const duration = end.getTime() - start.getTime()
  const prevEnd = new Date(start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - duration)

  return { start, end, prevStart, prevEnd }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 100_000) return `${Math.round(n / 1_000)}k`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '--'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function getSourceIcon(source: string): string {
  const s = source.toLowerCase()
  if (s === 'direct') return '⚡'
  if (s.includes('google')) return '🔍'
  if (s.includes('facebook')) return '📘'
  if (s.includes('twitter') || s.includes('x.com') || s === 'twitter / x') return '𝕏'
  if (s.includes('instagram')) return '📷'
  if (s.includes('linkedin')) return '💼'
  if (s.includes('youtube')) return '📺'
  if (s.includes('reddit')) return '🤖'
  if (s.includes('tiktok')) return '🎵'
  if (s.includes('duckduckgo')) return '🦆'
  if (s.includes('hacker news') || s.includes('ycombinator')) return '🟠'
  if (s.includes('github')) return '🐙'
  if (s.includes('producthunt')) return '🐱'
  if (s.includes('bing')) return '🔵'
  return '🔗'
}

function getOSIcon(os: string): string {
  const s = os.toLowerCase()
  if (s.includes('windows')) return '🪟'
  if (s.includes('mac') || s.includes('osx') || s.includes('os x')) return '🍎'
  if (s.includes('ios') || s.includes('iphone') || s.includes('ipad')) return '📱'
  if (s.includes('android')) return '🤖'
  if (s.includes('linux') || s.includes('ubuntu')) return '🐧'
  return '💻'
}

export default function PublicDashboard() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [siteId, setSiteId] = useState<string | null>(null)
  const [domain, setDomain] = useState<string>('')

  // Period
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d')

  // Stats
  const [liveUsers, setLiveUsers] = useState(0)
  const [currentVisitors, setCurrentVisitors] = useState(0)
  const [prevVisitors, setPrevVisitors] = useState(0)
  const [currentPageviews, setCurrentPageviews] = useState(0)
  const [prevPageviews, setPrevPageviews] = useState(0)
  const [bounceRate, setBounceRate] = useState(0)
  const [avgDuration, setAvgDuration] = useState(0)
  const [prevAvgDuration, setPrevAvgDuration] = useState(0)

  // Chart
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [comparisonTrendData, setComparisonTrendData] = useState<TrendDataPoint[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [chartMetric, setChartMetric] = useState<ChartMetric>('visitors')

  // Tables
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [referrerSources, setReferrerSources] = useState<ReferrerSource[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([])
  const [browserBreakdown, setBrowserBreakdown] = useState<BrowserBreakdown[]>([])
  const [osBreakdown, setOsBreakdown] = useState<OSBreakdown[]>([])
  const [topCountries, setTopCountries] = useState<TopCountry[]>([])
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  const [countryCities, setCountryCities] = useState<{ [key: string]: City[] }>({})
  const [countriesLimit, setCountriesLimit] = useState(5)

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('conteo-theme')
      if (stored === 'dark' || stored === 'light') {
        setTheme(stored)
        document.documentElement.classList.toggle('dark', stored === 'dark')
      }
    }
  }, [])

  function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('conteo-theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  useEffect(() => {
    loadPublicDashboard()
  }, [token])

  useEffect(() => {
    if (siteId) loadStats()
  }, [siteId, timePeriod])

  async function toggleCountry(countryCode: string) {
    if (expandedCountry === countryCode) {
      setExpandedCountry(null)
      return
    }
    setExpandedCountry(countryCode)
    if (countryCities[countryCode] || !siteId) return

    try {
      const { start, end } = getPeriodDates(timePeriod)
      const { data: citiesData } = await supabase.rpc('get_cities_by_country', {
        site_uuid: siteId,
        country_code: countryCode,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        city_limit: 10,
      })
      if (citiesData) {
        setCountryCities((prev) => ({ ...prev, [countryCode]: citiesData }))
      }
    } catch (error) {
      console.error('Error loading cities:', error)
    }
  }

  async function loadPublicDashboard() {
    try {
      const { data: shareData, error: shareError } = await supabase
        .from('site_shares')
        .select('site_id, is_public, sites(domain)')
        .eq('share_token', token)
        .eq('is_public', true)
        .single()

      if (shareError || !shareData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setSiteId(shareData.site_id)
      setDomain((shareData.sites as any).domain)
      setLoading(false)
    } catch (error) {
      console.error('Error loading public dashboard:', error)
      setNotFound(true)
      setLoading(false)
    }
  }

  async function loadStats() {
    if (!siteId) return

    try {
      const { start, end, prevStart, prevEnd } = getPeriodDates(timePeriod)
      const tzOffset = -new Date().getTimezoneOffset()
      const { granularity } = getGranularityForRange(timePeriod)

      const [
        liveRes,
        trendRes,
        compTrendRes,
        visitorsRes,
        prevVisitorsRes,
        pageviewsRes,
        prevPageviewsRes,
        pagesRes,
        referrersRes,
        deviceRes,
        browserRes,
        osRes,
        countriesRes,
        durationRes,
        prevDurationRes,
        scrollDepthRes,
        campaignsRes,
      ] = await Promise.all([
        supabase.rpc('get_live_users', { site_uuid: siteId }),
        supabase.rpc('get_trend_chart', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          granularity,
          tz_offset_minutes: tzOffset,
        }),
        supabase.rpc('get_trend_chart', {
          site_uuid: siteId,
          start_date: prevStart.toISOString(),
          end_date: prevEnd.toISOString(),
          granularity,
          tz_offset_minutes: tzOffset,
        }),
        supabase.rpc('get_unique_visitors', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        }),
        supabase.rpc('get_unique_visitors', {
          site_uuid: siteId,
          start_date: prevStart.toISOString(),
          end_date: prevEnd.toISOString(),
        }),
        supabase
          .from('pageviews')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', siteId)
          .gte('timestamp', start.toISOString())
          .lte('timestamp', end.toISOString()),
        supabase
          .from('pageviews')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', siteId)
          .gte('timestamp', prevStart.toISOString())
          .lte('timestamp', prevEnd.toISOString()),
        supabase.rpc('get_top_pages_with_devices', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          page_limit: 20,
        }),
        supabase.rpc('get_referrer_sources', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          source_limit: 20,
        }),
        supabase.rpc('get_device_breakdown', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        }),
        supabase.rpc('get_browser_breakdown', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        }),
        supabase.rpc('get_os_breakdown', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        }),
        supabase.rpc('get_top_countries', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          country_limit: 10,
        }),
        supabase.rpc('get_avg_session_duration', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        }),
        supabase.rpc('get_avg_session_duration', {
          site_uuid: siteId,
          start_date: prevStart.toISOString(),
          end_date: prevEnd.toISOString(),
        }),
        supabase.rpc('get_scroll_depth_summary', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        }),
        supabase.rpc('get_top_campaigns', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          campaign_limit: 10,
          campaign_offset: 0,
        }),
      ])

      setLiveUsers(liveRes.data || 0)
      setTrendData(trendRes.data || [])
      setComparisonTrendData(compTrendRes.data || [])
      setCurrentVisitors(visitorsRes.data || 0)
      setPrevVisitors(prevVisitorsRes.data || 0)
      setCurrentPageviews(pageviewsRes.count || 0)
      setPrevPageviews(prevPageviewsRes.count || 0)

      const dur = durationRes.data?.[0] || { avg_duration_all: 0 }
      const prevDur = prevDurationRes.data?.[0] || { avg_duration_all: 0 }
      setAvgDuration(dur.avg_duration_all || 0)
      setPrevAvgDuration(prevDur.avg_duration_all || 0)

      const pages: TopPage[] = pagesRes.data || []
      if (pages.length > 0) {
        const totalViews = pages.reduce((s, p) => s + p.pageviews, 0)
        const weighted = pages.reduce((s, p) => s + (p.bounce_rate || 0) * p.pageviews, 0)
        setBounceRate(totalViews > 0 ? weighted / totalViews : 0)
      } else {
        setBounceRate(0)
      }

      // Merge scroll depth data into pages
      const scrollData = scrollDepthRes.data || []
      const scrollMap = new Map(scrollData.map((s: any) => [s.path, s]))
      const pagesWithScroll = pages.map((p) => {
        const sd: any = scrollMap.get(p.path)
        return sd ? { ...p, pct_25: Number(sd.pct_25) || 0, pct_50: Number(sd.pct_50) || 0, pct_75: Number(sd.pct_75) || 0, pct_100: Number(sd.pct_100) || 0 } : p
      })
      setTopPages(pagesWithScroll)

      setReferrerSources(referrersRes.data || [])
      setDeviceBreakdown(deviceRes.data || [])
      setBrowserBreakdown(browserRes.data || [])
      setOsBreakdown(osRes.data || [])
      setTopCountries(countriesRes.data || [])
      setCampaigns(campaignsRes.data || [])
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const totalVisitors = referrerSources.reduce((s, r) => s + r.unique_visitors, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">404</h1>
          <p className="text-text-secondary mb-6">This dashboard is not available or has been made private.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            Go to Conteo.online
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 h-14">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <span className="text-sm font-semibold text-text-primary truncate hidden sm:inline">
              {domain}
            </span>
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full shrink-0">
              Public
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <DateRangePicker value={timePeriod} onChange={setTimePeriod} />

            <button
              onClick={toggleTheme}
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1A.5.5 0 018 1zm3.354 2.354a.5.5 0 010 .707l-.708.708a.5.5 0 11-.707-.708l.708-.707a.5.5 0 01.707 0zM14 7.5a.5.5 0 010 1h-1a.5.5 0 010-1h1zm-1.646 3.854a.5.5 0 010-.707l.708-.708a.5.5 0 01.707.708l-.708.707a.5.5 0 01-.707 0zM8 13a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1A.5.5 0 018 13zm-3.354-2.354a.5.5 0 010-.707l.708-.708a.5.5 0 11.707.708l-.708.707a.5.5 0 01-.707 0zM3 7.5a.5.5 0 010 1H2a.5.5 0 010-1h1zm.646-3.146a.5.5 0 01.707 0l.708.707a.5.5 0 11-.708.708L3.646 5.06a.5.5 0 010-.707zM8 5a3 3 0 100 6 3 3 0 000-6z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6 .278a.768.768 0 01.08.858 7.208 7.208 0 00-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 01.81.316.733.733 0 01-.031.893A8.349 8.349 0 018.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 016 .278z" />
                </svg>
              )}
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md hover:opacity-90 transition"
            >
              <span>⚡</span>
              <span className="hidden sm:inline">conteo.online</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <section className="flex flex-wrap gap-0 -mx-2 sm:mx-0">
          <StatCard
            label="Live Users"
            value={liveUsers.toString()}
            tooltip="Active users in the last 5 minutes"
          />
          <StatCard
            label="Unique visitors"
            value={formatNumber(currentVisitors)}
            delta={calcDelta(currentVisitors, prevVisitors)}
            tooltip="Unique visitors in this period"
          />
          <StatCard
            label="Total pageviews"
            value={formatNumber(currentPageviews)}
            delta={calcDelta(currentPageviews, prevPageviews)}
            tooltip="Total pageviews in this period"
          />
          <StatCard
            label="Bounce rate"
            value={`${Math.round(bounceRate)}%`}
            tooltip="Percentage of visitors who viewed only one page"
          />
          <StatCard
            label="Visit duration"
            value={formatDuration(avgDuration)}
            delta={calcDelta(avgDuration, prevAvgDuration)}
            tooltip="Average time spent per session"
          />
        </section>

        {/* Chart */}
        <section className="border border-border rounded-lg bg-bg-card p-4">
          <VisitorChart
            data={trendData}
            comparisonData={comparisonTrendData}
            timePeriod={timePeriod}
            metric={chartMetric}
            showComparison={showComparison}
            onMetricChange={setChartMetric}
            onComparisonChange={setShowComparison}
          />
        </section>

        {/* Top Pages & Top Sources */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Top pages"
              columns={[
                {
                  key: 'path',
                  label: 'Page',
                  render: (val: string) => (
                    <span className="text-sm font-medium text-text-primary truncate max-w-[200px] block" title={val}>{val}</span>
                  ),
                },
                { key: 'unique_visitors', label: 'Visitors', align: 'right' },
                { key: 'pageviews', label: 'Views', align: 'right', render: (v: number) => formatNumber(v) },
                {
                  key: 'pct_25',
                  label: 'Scroll',
                  align: 'right',
                  render: (_: any, row: TopPage) =>
                    row.pct_25 != null ? (
                      <ScrollDepthMini pct25={row.pct_25 || 0} pct50={row.pct_50 || 0} pct75={row.pct_75 || 0} pct100={row.pct_100 || 0} />
                    ) : (
                      <span className="text-text-tertiary text-xs">—</span>
                    ),
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
                      <span className="truncate max-w-[160px]">{val}</span>
                    </span>
                  ),
                },
                { key: 'unique_visitors', label: 'Visitors', align: 'right' },
                {
                  key: '_pct',
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

        {/* Countries & Devices */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Countries */}
          <div className="border border-border rounded-lg bg-bg-card p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Countries</h3>
            {topCountries.length === 0 ? (
              <p className="text-sm text-text-tertiary py-4">No country data yet</p>
            ) : (
              <>
                <div className="space-y-1">
                  {topCountries.slice(0, countriesLimit).map((row) => {
                    const isExpanded = expandedCountry === row.country
                    const cities = countryCities[row.country] || []
                    return (
                      <div key={row.country}>
                        <div
                          className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-bg-secondary cursor-pointer transition-colors"
                          onClick={() => toggleCountry(row.country)}
                        >
                          <div className="flex items-center gap-2">
                            <span>{getCountryFlag(row.country)}</span>
                            <span className="text-sm text-text-primary">{getCountryName(row.country) || row.country}</span>
                            <span className="text-xs text-text-tertiary">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                          <span className="text-sm font-medium text-text-primary">{row.unique_visitors.toLocaleString()}</span>
                        </div>
                        {isExpanded && cities.length > 0 && (
                          <div className="ml-6 pl-3 border-l border-border space-y-0.5 py-1">
                            {cities.map((city) => (
                              <div key={city.city} className="flex items-center justify-between text-xs py-0.5">
                                <span className="text-text-secondary">{city.city}</span>
                                <span className="text-text-tertiary">{city.unique_visitors.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {topCountries.length > 5 && (
                  <button
                    onClick={() => setCountriesLimit(countriesLimit === 5 ? topCountries.length : 5)}
                    className="w-full mt-2 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-md transition-colors"
                  >
                    {countriesLimit === 5 ? `Show all (${topCountries.length})` : 'Show less'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Devices */}
          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Devices"
              columns={[
                {
                  key: 'device',
                  label: 'Device',
                  render: (val: string) => (
                    <span className="flex items-center gap-1.5">
                      <span>{val === 'Desktop' ? '💻' : val === 'Mobile' ? '📱' : '📟'}</span>
                      <span>{val}</span>
                    </span>
                  ),
                },
                { key: 'unique_visitors', label: 'Visitors', align: 'right' },
                {
                  key: '_pct',
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

        {/* Browsers & OS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Browsers"
              columns={[
                { key: 'browser', label: 'Browser' },
                { key: 'unique_visitors', label: 'Visitors', align: 'right' },
                {
                  key: '_pct',
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

          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Operating systems"
              columns={[
                {
                  key: 'os',
                  label: 'OS',
                  render: (val: string) => (
                    <span className="flex items-center gap-1.5">
                      <span>{getOSIcon(val)}</span>
                      <span>{val}</span>
                    </span>
                  ),
                },
                { key: 'unique_visitors', label: 'Visitors', align: 'right' },
                {
                  key: '_pct',
                  label: '%',
                  align: 'right',
                  render: (_: any, row: OSBreakdown) => {
                    const total = osBreakdown.reduce((s, o) => s + o.unique_visitors, 0)
                    return `${total > 0 ? Math.round((row.unique_visitors / total) * 100) : 0}%`
                  },
                },
              ]}
              data={osBreakdown}
              maxKey="unique_visitors"
              emptyMessage="No OS data yet"
            />
          </div>
        </section>

        {/* UTM Campaigns */}
        {campaigns.length > 0 && (
          <section className="border border-border rounded-lg bg-bg-card p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">UTM Campaigns</h3>
            <div className="data-table overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr>
                    <th className="pb-2 text-left pr-2">Campaign</th>
                    <th className="pb-2 text-left pr-2">Source</th>
                    <th className="pb-2 text-left pr-2">Medium</th>
                    <th className="pb-2 text-right pr-2">Views</th>
                    <th className="pb-2 text-right">Visitors</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((row, i) => {
                    const maxViews = Math.max(...campaigns.map(c => c.pageviews), 1)
                    return (
                      <tr key={i} className="group relative">
                        <td className="py-2 pr-2 relative">
                          <div
                            className="absolute inset-y-0 left-0 rounded-sm transition-all duration-[400ms] ease-out group-hover:opacity-[0.18]"
                            style={{ width: `${(row.pageviews / maxViews) * 100}%`, background: 'var(--color-primary)', opacity: 0.08 }}
                          />
                          <span className="relative z-10 font-medium text-text-primary">
                            {row.utm_campaign || '—'}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-text-secondary relative z-10">
                          <span className="flex items-center gap-1">
                            <span>{getSourceIcon(row.utm_source || '')}</span>
                            {row.utm_source || '—'}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-text-secondary relative z-10">{row.utm_medium || '—'}</td>
                        <td className="py-2 pr-2 text-right relative z-10">{formatNumber(row.pageviews)}</td>
                        <td className="py-2 text-right relative z-10">{formatNumber(row.unique_visitors)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6 text-center">
        <p className="text-xs text-text-tertiary">
          Powered by{' '}
          <Link href="/" className="text-primary hover:underline">
            conteo.online
          </Link>
          {' '}— Privacy-friendly analytics
        </p>
      </footer>
    </div>
  )
}
