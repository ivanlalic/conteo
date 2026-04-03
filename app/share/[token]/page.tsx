'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import VisitorChart, { type TrendDataPoint } from '@/components/dashboard/VisitorChart'
import StatCard from '@/components/dashboard/StatCard'
import DataTable from '@/components/dashboard/DataTable'
import DateRangePicker, { type TimePeriod } from '@/components/dashboard/DateRangePicker'
import { getCountryFlag, getCountryName } from '@/lib/utils'
import { getGranularityForRange, type ChartMetric } from '@/lib/chart-utils'
import Link from 'next/link'

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

  // Chart
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [comparisonTrendData, setComparisonTrendData] = useState<TrendDataPoint[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [chartMetric, setChartMetric] = useState<ChartMetric>('visitors')

  // Tables
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([])
  const [topCountries, setTopCountries] = useState<TopCountry[]>([])
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  const [countryCities, setCountryCities] = useState<{ [key: string]: City[] }>({})
  const [countriesLimit, setCountriesLimit] = useState(5)

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
        deviceRes,
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
      setTopCountries(countriesRes.data || [])
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

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

        {/* Two Column Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Pages */}
          <DataTable
            title="Top Pages"
            columns={[
              {
                key: 'path',
                label: 'Page',
                render: (val: string) => (
                  <span className="text-sm font-medium text-text-primary truncate max-w-[200px] block">{val}</span>
                ),
              },
              { key: 'pageviews', label: 'Views', align: 'right' },
              { key: 'unique_visitors', label: 'Unique', align: 'right' },
            ]}
            data={topPages}
            maxKey="pageviews"
            emptyMessage="No pageviews yet"
          />

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
        </section>

        {/* Devices */}
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
          ]}
          data={deviceBreakdown}
          maxKey="unique_visitors"
          emptyMessage="No device data yet"
        />
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
