'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import PageviewsChart from '@/components/PageviewsChart'
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

  useEffect(() => {
    loadPublicDashboard()
  }, [token])

  useEffect(() => {
    if (siteId) {
      loadStats()
    }
  }, [siteId, timePeriod])

  function getPeriodLabel() {
    if (timePeriod === 'today') return 'Today'
    if (timePeriod === '7days') return 'Last 7 Days'
    return 'Last 30 Days'
  }

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

      const { data: citiesData, error } = await supabase
        .rpc('get_cities_by_country', {
          site_uuid: siteId,
          country_code: countryCode,
          start_date: periodStart.toISOString(),
          end_date: now.toISOString(),
          city_limit: 5
        })

      if (!error && citiesData) {
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
      // Check if share exists and is public
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

      // Live users (last 5 minutes)
      const { data: liveUsersData } = await supabase
        .rpc('get_live_users', { site_uuid: siteId })

      // Today's pageviews
      const { count: todayCount } = await supabase
        .from('pageviews')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('timestamp', today.toISOString())

      // Week's pageviews
      const { count: weekCount } = await supabase
        .from('pageviews')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('timestamp', weekAgo.toISOString())

      // Month's pageviews
      const { count: monthCount } = await supabase
        .from('pageviews')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('timestamp', monthAgo.toISOString())

      // Top pages with device breakdown
      const { data: topPagesData } = await supabase
        .rpc('get_top_pages_with_devices', {
          site_uuid: siteId,
          start_date: periodStart.toISOString(),
          end_date: now.toISOString(),
          page_limit: 5
        })

      // Device breakdown
      const { data: deviceData } = await supabase
        .rpc('get_device_breakdown', {
          site_uuid: siteId,
          start_date: periodStart.toISOString(),
          end_date: now.toISOString()
        })

      // Top countries
      const { data: topCountriesData } = await supabase
        .rpc('get_top_countries', {
          site_uuid: siteId,
          start_date: periodStart.toISOString(),
          end_date: now.toISOString(),
          country_limit: 5
        })

      // Chart data
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-6">This dashboard is not available or has been made private.</p>
          <Link
            href="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Go to Conteo.online
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Powered by badge */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">{domain}</h1>
              <p className="text-xs md:text-sm text-gray-500">Public Analytics</p>
            </div>
            <Link
              href="/"
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition shadow-md"
            >
              <span>⚡</span>
              <span>Powered by conteo.online</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Grid - Clean & Prominent */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Live Users */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">Live Users</h3>
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-gray-900">{stats.liveUsers}</p>
            <p className="text-xs text-gray-400 mt-1">last 5 min</p>
          </div>

          {/* Today */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Today</h3>
            <p className="text-3xl md:text-4xl font-bold text-gray-900">{stats.todayViews.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">pageviews</p>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">This Week</h3>
            <p className="text-3xl md:text-4xl font-bold text-gray-900">{stats.weekViews.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">pageviews</p>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">This Month</h3>
            <p className="text-3xl md:text-4xl font-bold text-gray-900">{stats.monthViews.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">pageviews</p>
          </div>
        </div>

        {/* Chart - Prominent */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Pageviews Over Time</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs md:text-sm text-gray-600">Period:</span>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as 'today' | '7days' | '30days')}
                className="bg-white border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>
          <div className="p-4 md:p-6">
            <div className="h-64">
              <PageviewsChart data={chartData} />
            </div>
          </div>
        </div>

        {/* Two Column Grid: Top Pages & Top Countries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Top Pages */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Top Pages</h3>
            </div>
            <div className="p-4 md:p-6">
              {topPages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No pageviews yet.
                </p>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Page
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Views
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Desktop
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mobile
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unique
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {topPages.map((page, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {page.path}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                              {Number(page.pageviews).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                              {Number(page.desktop_views).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                              {Number(page.mobile_views).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-500">
                              {Number(page.unique_visitors).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {topPages.map((page, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="font-semibold text-sm text-gray-900 break-words">
                          {page.path}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white rounded p-2">
                            <div className="text-gray-500">Total</div>
                            <div className="font-bold text-indigo-600">{Number(page.pageviews).toLocaleString()}</div>
                          </div>
                          <div className="bg-white rounded p-2">
                            <div className="text-gray-500">Unique</div>
                            <div className="font-semibold text-gray-900">{Number(page.unique_visitors).toLocaleString()}</div>
                          </div>
                          <div className="bg-white rounded p-2">
                            <div className="text-gray-500">Desktop</div>
                            <div className="font-semibold text-gray-700">{Number(page.desktop_views).toLocaleString()}</div>
                          </div>
                          <div className="bg-white rounded p-2">
                            <div className="text-gray-500">Mobile</div>
                            <div className="font-semibold text-gray-700">{Number(page.mobile_views).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Top Countries */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Top Countries</h3>
            </div>
            <div className="p-4 md:p-6">
              {topCountries.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No country data available yet.</p>
              ) : (
                <div className="space-y-2">
                  {topCountries.map((country, i) => {
                    const isExpanded = expandedCountry === country.country
                    const cities = countryCities[country.country] || []

                    return (
                      <div key={i}>
                        {/* Country Row */}
                        <div
                          onClick={() => toggleCountry(country.country)}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-2xl flex-shrink-0">{getCountryFlag(country.country)}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">{getCountryName(country.country)}</p>
                              <p className="text-xs text-gray-500">{Number(country.unique_visitors).toLocaleString()} visitors</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-bold text-indigo-600">{Number(country.pageviews).toLocaleString()}</p>
                              <p className="text-xs text-gray-500">views</p>
                            </div>
                            <span className="text-gray-400 transition-transform text-sm" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                              ▼
                            </span>
                          </div>
                        </div>

                        {/* Cities Dropdown */}
                        {isExpanded && (
                          <div className="ml-6 mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
                            {cities.length === 0 ? (
                              <p className="text-xs text-gray-400 py-2">Loading cities...</p>
                            ) : (
                              cities.map((city, j) => (
                                <div key={j} className="flex items-center justify-between py-2 px-2 bg-white rounded border border-gray-100">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-700 truncate">{city.city}</p>
                                    <p className="text-xs text-gray-400">{Number(city.unique_visitors).toLocaleString()} visitors</p>
                                  </div>
                                  <p className="text-xs font-semibold text-gray-600 ml-2">{Number(city.pageviews).toLocaleString()}</p>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Device Breakdown</h3>
          </div>
          <div className="p-4 md:p-6">
            {deviceBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No device data available yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deviceBreakdown.map((device) => {
                  const totalViews = deviceBreakdown.reduce((sum, d) => sum + Number(d.pageviews), 0)
                  const percentage = totalViews > 0 ? ((Number(device.pageviews) / totalViews) * 100).toFixed(1) : '0.0'

                  return (
                    <div key={device.device} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-2xl">
                            {device.device === 'Mobile' ? '📱' : device.device === 'Desktop' ? '💻' : '❓'}
                          </span>
                          <h4 className="text-base font-semibold text-gray-900">{device.device}</h4>
                        </div>
                        <p className="text-xs text-gray-600">{Number(device.unique_visitors).toLocaleString()} visitors</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-600">{percentage}%</p>
                        <p className="text-xs text-gray-500">{Number(device.pageviews).toLocaleString()} views</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer with CTA */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-xl p-6 md:p-8 text-center text-white">
          <h3 className="text-xl md:text-2xl font-bold mb-2">Want analytics like this for your site?</h3>
          <p className="text-indigo-100 mb-4 text-sm md:text-base">
            Simple, privacy-focused analytics for indie hackers. No cookies, no tracking scripts, just clean data.
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-indigo-600 px-6 md:px-8 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-bold hover:bg-indigo-50 transition shadow-lg"
          >
            Get Started Free →
          </Link>
        </div>

      </main>
    </div>
  )
}
