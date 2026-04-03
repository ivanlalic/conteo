'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import VisitorChart, { type TrendDataPoint } from '@/components/dashboard/VisitorChart'
import DateRangePicker, { type TimePeriod } from '@/components/dashboard/DateRangePicker'
import { getCountryFlag, getCountryName } from '@/lib/utils'
import { getGranularityForRange, type ChartMetric } from '@/lib/chart-utils'
import { useTheme } from '@/components/ThemeProvider'

interface TopPage {
  path: string
  pageviews: number
  unique_visitors: number
  mobile_views: number
  desktop_views: number
}

interface DeviceBreakdown {
  device: string
  pageviews: number
  unique_visitors: number
}

interface ReferrerSource {
  source: string
  visits: number
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

export default function DemoDashboard() {
  const { resolvedTheme, setTheme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [siteId, setSiteId] = useState<string | null>(null)

  // Period
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7d')

  // Stats
  const [liveUsers, setLiveUsers] = useState(0)
  const [currentVisitors, setCurrentVisitors] = useState(0)
  const [prevVisitors, setPrevVisitors] = useState(0)
  const [currentPageviews, setCurrentPageviews] = useState(0)
  const [prevPageviews, setPrevPageviews] = useState(0)

  // Chart
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [comparisonTrendData, setComparisonTrendData] = useState<TrendDataPoint[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [chartMetric, setChartMetric] = useState<ChartMetric>('visitors')

  // Tables
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([])
  const [referrerSources, setReferrerSources] = useState<ReferrerSource[]>([])
  const [topCountries, setTopCountries] = useState<TopCountry[]>([])
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  const [countryCities, setCountryCities] = useState<{ [key: string]: City[] }>({})

  // UI
  const [isEmbedded, setIsEmbedded] = useState(false)
  const [countriesLimit, setCountriesLimit] = useState(3)
  const [pagesLimit, setPagesLimit] = useState(3)
  const [sourcesLimit, setSourcesLimit] = useState(3)

  useEffect(() => {
    setIsEmbedded(window.self !== window.top)
    loadDemoSite()
  }, [])

  useEffect(() => {
    if (siteId) loadStats()
  }, [siteId, timePeriod])

  async function loadDemoSite() {
    try {
      const { data, error: queryError } = await supabase
        .from('site_shares')
        .select('share_token, site_id, sites!inner(domain)')
        .eq('is_public', true)
        .eq('sites.domain', 'conteo.online')
        .single()

      if (queryError || !data) {
        setError(true)
        setLoading(false)
        return
      }

      setSiteId(data.site_id)
      setLoading(false)
    } catch {
      setError(true)
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
        deviceRes,
        referrerRes,
        countriesRes,
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
          page_limit: 5,
        }),
        supabase.rpc('get_device_breakdown', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        }),
        supabase.rpc('get_referrer_sources', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          source_limit: 5,
        }),
        supabase.rpc('get_top_countries', {
          site_uuid: siteId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          country_limit: 10,
        }),
      ])

      setLiveUsers(liveRes.data || 0)
      setTrendData(trendRes.data || [])
      setComparisonTrendData(compTrendRes.data || [])
      setCurrentVisitors(visitorsRes.data || 0)
      setPrevVisitors(prevVisitorsRes.data || 0)
      setCurrentPageviews(pageviewsRes.count || 0)
      setPrevPageviews(prevPageviewsRes.count || 0)
      setTopPages(pagesRes.data || [])
      setDeviceBreakdown(deviceRes.data || [])
      setReferrerSources(referrerRes.data || [])
      setTopCountries(countriesRes.data || [])
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="text-center">
          <p className="text-text-secondary">Unable to load demo dashboard</p>
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
              conteo.online
            </span>
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full shrink-0">
              Live
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <DateRangePicker value={timePeriod} onChange={setTimePeriod} />

            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
              title="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1A.5.5 0 018 1zm3.354 2.354a.5.5 0 010 .707l-.708.708a.5.5 0 11-.707-.708l.708-.707a.5.5 0 01.707 0zM14 7.5a.5.5 0 010 1h-1a.5.5 0 010-1h1zm-1.646 3.854a.5.5 0 010-.707l.708-.708a.5.5 0 01.707.708l-.708.707a.5.5 0 01-.707 0zM8 13a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1A.5.5 0 018 13zm-3.354-2.354a.5.5 0 010-.707l.708-.708a.5.5 0 11.707.708l-.708.707a.5.5 0 01-.707 0zM3 7.5a.5.5 0 010 1H2a.5.5 0 010-1h1zm.646-3.146a.5.5 0 01.707 0l.708.707a.5.5 0 11-.708.708L3.646 5.06a.5.5 0 010-.707zM8 5a3 3 0 100 6 3 3 0 000-6z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6 .278a.768.768 0 01.08.858 7.208 7.208 0 00-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 01.81.316.733.733 0 01-.031.893A8.349 8.349 0 018.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 016 .278z" />
                </svg>
              )}
            </button>

            {!isEmbedded && (
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md hover:opacity-90 transition"
              >
                <span>⚡</span>
                <span className="hidden sm:inline">Get Started</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="border border-border rounded-lg bg-bg-card p-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide">Live Users</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            <p className="text-xl font-bold text-text-primary">{liveUsers}</p>
            <p className="text-xs text-text-tertiary mt-0.5">last 5 min</p>
          </div>

          <div className="border border-border rounded-lg bg-bg-card p-3">
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">Visitors</h3>
            <p className="text-xl font-bold text-text-primary">{formatNumber(currentVisitors)}</p>
            {calcDelta(currentVisitors, prevVisitors) !== null && (
              <p className={`text-xs mt-0.5 font-medium ${calcDelta(currentVisitors, prevVisitors)! >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {calcDelta(currentVisitors, prevVisitors)! >= 0 ? '↑' : '↓'} {Math.abs(Math.round(calcDelta(currentVisitors, prevVisitors)!))}%
              </p>
            )}
          </div>

          <div className="border border-border rounded-lg bg-bg-card p-3">
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">Pageviews</h3>
            <p className="text-xl font-bold text-text-primary">{formatNumber(currentPageviews)}</p>
            {calcDelta(currentPageviews, prevPageviews) !== null && (
              <p className={`text-xs mt-0.5 font-medium ${calcDelta(currentPageviews, prevPageviews)! >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {calcDelta(currentPageviews, prevPageviews)! >= 0 ? '↑' : '↓'} {Math.abs(Math.round(calcDelta(currentPageviews, prevPageviews)!))}%
              </p>
            )}
          </div>

          <div className="border border-border rounded-lg bg-bg-card p-3">
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">Views/Visit</h3>
            <p className="text-xl font-bold text-text-primary">
              {currentVisitors > 0 ? (currentPageviews / currentVisitors).toFixed(1) : '--'}
            </p>
            <p className="text-xs text-text-tertiary mt-0.5">avg pages</p>
          </div>
        </section>

        {/* Chart */}
        <section className="border border-border rounded-lg bg-bg-card p-3">
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

        {/* Two Column Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Pages */}
          <div className="border border-border rounded-lg bg-bg-card p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Top Pages</h3>
            {topPages.length === 0 ? (
              <p className="text-sm text-text-tertiary py-4">No pageviews yet</p>
            ) : (
              <>
                <div className="space-y-1">
                  {topPages.slice(0, pagesLimit).map((page: TopPage, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{page.path}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-semibold text-text-primary">{page.pageviews.toLocaleString()}</p>
                        <p className="text-xs text-text-tertiary">{page.unique_visitors.toLocaleString()} unique</p>
                      </div>
                    </div>
                  ))}
                </div>
                {topPages.length > 3 && (
                  <button
                    onClick={() => setPagesLimit(pagesLimit === 3 ? topPages.length : 3)}
                    className="w-full mt-2 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-md transition-colors"
                  >
                    {pagesLimit === 3 ? `Show all (${topPages.length})` : 'Show less'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Sources */}
          <div className="border border-border rounded-lg bg-bg-card p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Top Sources</h3>
            {referrerSources.length === 0 ? (
              <p className="text-sm text-text-tertiary py-4">No referrers yet</p>
            ) : (
              <>
                <div className="space-y-1">
                  {referrerSources.slice(0, sourcesLimit).map((source: ReferrerSource, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <p className="text-sm text-text-primary">{source.source}</p>
                      <p className="text-sm font-medium text-text-primary">{source.unique_visitors.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                {referrerSources.length > 3 && (
                  <button
                    onClick={() => setSourcesLimit(sourcesLimit === 3 ? referrerSources.length : 3)}
                    className="w-full mt-2 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-md transition-colors"
                  >
                    {sourcesLimit === 3 ? `Show all (${referrerSources.length})` : 'Show less'}
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* Countries + Devices */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Countries */}
          <div className="border border-border rounded-lg bg-bg-card p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Countries</h3>
            {topCountries.length === 0 ? (
              <p className="text-sm text-text-tertiary py-4">No country data yet</p>
            ) : (
              <div className="space-y-1">
                {topCountries.slice(0, countriesLimit).map((row: TopCountry) => {
                  const isExpanded = expandedCountry === row.country
                  const cities = countryCities[row.country] || []
                  return (
                    <div key={row.country}>
                      <div
                        className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-bg-secondary cursor-pointer transition-colors"
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
                          {cities.map((city: City) => (
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
            )}
          </div>

          {/* Devices */}
          <div className="border border-border rounded-lg bg-bg-card p-3">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Devices</h3>
            {deviceBreakdown.length === 0 ? (
              <p className="text-sm text-text-tertiary py-4">No device data yet</p>
            ) : (
              <div className="space-y-1">
                {deviceBreakdown.map((device: DeviceBreakdown) => (
                  <div key={device.device} className="flex items-center justify-between py-1.5 px-2 rounded-md">
                    <div className="flex items-center gap-2">
                      <span>{device.device === 'Desktop' ? '💻' : device.device === 'Mobile' ? '📱' : '📟'}</span>
                      <span className="text-sm text-text-primary">{device.device}</span>
                    </div>
                    <span className="text-sm font-medium text-text-primary">{device.unique_visitors.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      {!isEmbedded && (
        <footer className="border-t border-border mt-8 py-4 text-center">
          <p className="text-xs text-text-tertiary">
            Powered by{' '}
            <Link href="/" className="text-primary hover:underline">
              conteo.online
            </Link>
            {' '}— Privacy-friendly analytics
          </p>
        </footer>
      )}
    </div>
  )
}
