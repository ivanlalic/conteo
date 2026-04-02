'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import PageviewsChart from '@/components/PageviewsChart'
import StatCard from '@/components/dashboard/StatCard'
import DataTable from '@/components/dashboard/DataTable'
import { getCountryFlag, getCountryName } from '@/lib/utils'
import Link from 'next/link'

interface TopPage {
  path: string
  pageviews: number
  unique_visitors: number
  mobile_views: number
  desktop_views: number
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

export default function PublicDashboard() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [siteId, setSiteId] = useState<string | null>(null)
  const [domain, setDomain] = useState<string>('')
  const [stats, setStats] = useState({
    liveUsers: 0,
    todayViews: 0,
    weekViews: 0,
    monthViews: 0,
  })
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([])
  const [topCountries, setTopCountries] = useState<TopCountry[]>([])
  const [timePeriod, setTimePeriod] = useState<'today' | '7days' | '30days'>('7days')
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  const [countryCities, setCountryCities] = useState<{ [key: string]: City[] }>({})
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [countriesLimit, setCountriesLimit] = useState(5)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored === 'dark' || stored === 'light') {
        setTheme(stored)
        document.documentElement.classList.toggle('dark', stored === 'dark')
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setTheme(prefersDark ? 'dark' : 'light')
        document.documentElement.classList.toggle('dark', prefersDark)
      }
    }
  }, [])

  function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  useEffect(() => {
    loadPublicDashboard()
  }, [token])

  useEffect(() => {
    if (siteId) {
      loadStats()
    }
  }, [siteId, timePeriod])

  async function toggleCountry(countryCode: string) {
    if (expandedCountry === countryCode) {
      setExpandedCountry(null)
      return
    }

    setExpandedCountry(countryCode)

    if (countryCities[countryCode]) {
      return
    }

    if (!siteId) return

    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      let periodStart: Date
      if (timePeriod === 'today') {
        periodStart = today
      } else if (timePeriod === '7days') {
        periodStart = weekAgo
      } else {
        periodStart = monthAgo
      }

      const { data: citiesData } = await supabase
        .rpc('get_cities_by_country', {
          site_uuid: siteId,
          country_code: countryCode,
          start_date: periodStart.toISOString(),
          end_date: now.toISOString(),
          city_limit: 10
        })

      if (citiesData) {
        setCountryCities(prev => ({
          ...prev,
          [countryCode]: citiesData
        }))
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
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      let periodStart: Date
      if (timePeriod === 'today') {
        periodStart = today
      } else if (timePeriod === '7days') {
        periodStart = weekAgo
      } else {
        periodStart = monthAgo
      }

      const { data: liveUsersData } = await supabase
        .rpc('get_live_users', { site_uuid: siteId })

      const { count: todayCount } = await supabase
        .from('pageviews')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('timestamp', today.toISOString())

      const { count: weekCount } = await supabase
        .from('pageviews')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('timestamp', weekAgo.toISOString())

      const { count: monthCount } = await supabase
        .from('pageviews')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('timestamp', monthAgo.toISOString())

      const { data: topPagesData } = await supabase
        .rpc('get_top_pages_with_devices', {
          site_uuid: siteId,
          start_date: periodStart.toISOString(),
          end_date: now.toISOString(),
          page_limit: 5
        })

      const { data: deviceData } = await supabase
        .rpc('get_device_breakdown', {
          site_uuid: siteId,
          start_date: periodStart.toISOString(),
          end_date: now.toISOString()
        })

      const { data: topCountriesData } = await supabase
        .rpc('get_top_countries', {
          site_uuid: siteId,
          start_date: periodStart.toISOString(),
          end_date: now.toISOString(),
          country_limit: 10
        })

      const timezoneOffsetMinutes = -new Date().getTimezoneOffset()

      const { data: chartDataRaw } = await supabase
        .rpc('get_pageviews_chart', {
          site_uuid: siteId,
          start_date: periodStart.toISOString(),
          end_date: now.toISOString(),
          tz_offset_minutes: timezoneOffsetMinutes
        })

      setStats({
        liveUsers: liveUsersData || 0,
        todayViews: todayCount || 0,
        weekViews: weekCount || 0,
        monthViews: monthCount || 0,
      })

      setTopPages(topPagesData || [])
      setChartData(chartDataRaw || [])
      setDeviceBreakdown(deviceData || [])
      setTopCountries(topCountriesData || [])

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
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-bg-card/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <span className="text-sm font-semibold text-text-primary truncate">
                {domain}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                Public
              </span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as 'today' | '7days' | '30days')}
                className="text-sm bg-transparent border border-border rounded-md px-2 py-1 text-text-primary outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>

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
              value={stats.liveUsers.toString()}
              tooltip="Usuarios activos en los últimos 5 minutos"
            />
            <StatCard
              label="Today"
              value={stats.todayViews.toLocaleString()}
              tooltip="Pageviews del día de hoy"
            />
            <StatCard
              label="This Week"
              value={stats.weekViews.toLocaleString()}
              tooltip="Pageviews de los últimos 7 días"
            />
            <StatCard
              label="This Month"
              value={stats.monthViews.toLocaleString()}
              tooltip="Pageviews de los últimos 30 días"
            />
          </section>

          {/* Chart */}
          <section className="border border-border rounded-lg bg-bg-card p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Pageviews Over Time</h3>
            <div className="h-64">
              <PageviewsChart data={chartData} />
            </div>
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
    </div>
  )
}
