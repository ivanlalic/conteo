'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import PageviewsChart from '@/components/PageviewsChart'
import { getCountryFlag, getCountryName } from '@/lib/utils'
import InfoTooltip from '@/components/InfoTooltip'

interface TopPage {
  path: string
  pageviews: number
  unique_visitors: number
  mobile_views: number
  desktop_views: number
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

interface City {
  city: string
  pageviews: number
  unique_visitors: number
}

export default function DemoDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [siteId, setSiteId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    liveUsers: 0,
    todayViews: 0,
    weekViews: 0,
    monthViews: 0,
  })
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([])
  const [browserBreakdown, setBrowserBreakdown] = useState<BrowserBreakdown[]>([])
  const [referrerSources, setReferrerSources] = useState<ReferrerSource[]>([])
  const [topCountries, setTopCountries] = useState<TopCountry[]>([])
  const [timePeriod, setTimePeriod] = useState<'today' | '7days' | '30days'>('7days')
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  const [countryCities, setCountryCities] = useState<{ [key: string]: City[] }>({})

  useEffect(() => {
    loadDemoSite()
  }, [])

  useEffect(() => {
    if (siteId) {
      loadStats()
    }
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

  async function toggleCountry(countryCode: string) {
    if (expandedCountry === countryCode) {
      setExpandedCountry(null)
      return
    }

    setExpandedCountry(countryCode)

    if (countryCities[countryCode]) return
    if (!siteId) return

    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      let periodStart: Date
      if (timePeriod === 'today') periodStart = today
      else if (timePeriod === '7days') periodStart = weekAgo
      else periodStart = monthAgo

      const { data: citiesData, error } = await supabase
        .rpc('get_cities_by_country', {
          site_uuid: siteId,
          country_code: countryCode,
          start_date: periodStart.toISOString(),
          end_date: now.toISOString(),
          city_limit: 5
        })

      if (!error && citiesData) {
        setCountryCities(prev => ({ ...prev, [countryCode]: citiesData }))
      }
    } catch (err) {
      console.error('Error loading cities:', err)
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
      if (timePeriod === 'today') periodStart = today
      else if (timePeriod === '7days') periodStart = weekAgo
      else periodStart = monthAgo

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

      const { data: browserData } = await supabase
        .rpc('get_browser_breakdown', {
          site_uuid: siteId,
          start_date: periodStart.toISOString(),
          end_date: now.toISOString()
        })

      const { data: referrerSourcesData } = await supabase
        .rpc('get_referrer_sources', {
          site_uuid: siteId,
          start_date: periodStart.toISOString(),
          end_date: now.toISOString(),
          source_limit: 5
        })

      const { data: topCountriesData } = await supabase
        .rpc('get_top_countries', {
          site_uuid: siteId,
          start_date: periodStart.toISOString(),
          end_date: now.toISOString(),
          country_limit: 5
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
      setBrowserBreakdown(browserData || [])
      setReferrerSources(referrerSourcesData || [])
      setTopCountries(topCountriesData || [])
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading demo...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Demo Unavailable</h1>
          <p className="text-gray-600 mb-6">The demo dashboard is temporarily unavailable.</p>
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
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-2.5 px-4">
        <span className="text-sm">Esto es una demo en vivo de conteo.online &mdash; </span>
        <Link href="/signup" className="text-sm font-semibold underline underline-offset-2 hover:text-indigo-100 transition">
          Crear cuenta gratis &rarr;
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">conteo.online</h1>
              <p className="text-xs md:text-sm text-gray-500">Live Demo Dashboard</p>
            </div>
            <Link
              href="/"
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition shadow-md"
            >
              <span>conteo</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Live Users */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Live Users</span>
                <InfoTooltip text="Visitors currently active on your site (in the last 5 minutes)" />
              </div>
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-gray-900">{stats.liveUsers}</p>
          </div>

          {/* Today */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Today</span>
            <p className="text-3xl md:text-4xl font-bold text-gray-900">{stats.todayViews.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">pageviews</p>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">This Week</span>
            <p className="text-3xl md:text-4xl font-bold text-gray-900">{stats.weekViews.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">pageviews</p>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">This Month</span>
            <p className="text-3xl md:text-4xl font-bold text-gray-900">{stats.monthViews.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">pageviews</p>
          </div>
        </div>

        {/* Time Period Selector */}
        <div className="flex justify-end items-center mb-5">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600 font-medium">Period:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setTimePeriod('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  timePeriod === 'today'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimePeriod('7days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  timePeriod === '7days'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimePeriod('30days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  timePeriod === '30days'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>

        {/* 3-Column Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left Column - Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Pageviews Chart</h3>
              <div className="h-64">
                <PageviewsChart data={chartData} />
              </div>
            </div>

            {/* Top Pages Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">Top Pages</h3>
              </div>
              <div className="p-4">
                {topPages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No pageviews yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Desktop</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Mobile</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unique</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            <div className="inline-flex items-center">
                              Bounce %
                              <InfoTooltip text="Percentage of visitors who left without viewing another page. Lower is better." />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {topPages.map((page, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">{page.path}</td>
                            <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900">{Number(page.pageviews).toLocaleString()}</td>
                            <td className="px-3 py-2 text-sm text-right text-gray-600">{Number(page.desktop_views).toLocaleString()}</td>
                            <td className="px-3 py-2 text-sm text-right text-gray-600">{Number(page.mobile_views).toLocaleString()}</td>
                            <td className="px-3 py-2 text-sm text-right text-gray-500">{Number(page.unique_visitors).toLocaleString()}</td>
                            <td className="px-3 py-2 text-sm text-right font-medium text-orange-600">{Number(page.bounce_rate).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Sidebar (1/3) */}
          <div className="space-y-3">

            {/* Devices */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Devices</h3>
              {deviceBreakdown.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {deviceBreakdown.map((device) => {
                    const totalViews = deviceBreakdown.reduce((sum, d) => sum + Number(d.pageviews), 0)
                    const percentage = totalViews > 0 ? ((Number(device.pageviews) / totalViews) * 100).toFixed(1) : '0.0'
                    return (
                      <div key={device.device} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {device.device === 'Mobile' ? '📱' : device.device === 'Desktop' ? '💻' : '❓'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{device.device}</p>
                            <p className="text-xs text-gray-500">{Number(device.pageviews).toLocaleString()} views</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-indigo-600">{percentage}%</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Browsers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Browsers</h3>
              {browserBreakdown.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {browserBreakdown.map((browser) => {
                    const totalViews = browserBreakdown.reduce((sum, b) => sum + Number(b.pageviews), 0)
                    const percentage = totalViews > 0 ? ((Number(browser.pageviews) / totalViews) * 100).toFixed(1) : '0.0'
                    let icon = '🌐'
                    const browserLower = browser.browser.toLowerCase()
                    if (browserLower.includes('chrome')) icon = '🟢'
                    else if (browserLower.includes('safari')) icon = '🔵'
                    else if (browserLower.includes('firefox')) icon = '🟠'
                    else if (browserLower.includes('edge')) icon = '🔷'
                    else if (browserLower.includes('opera')) icon = '🔴'
                    return (
                      <div key={browser.browser} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{icon}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{browser.browser}</p>
                            <p className="text-xs text-gray-500">{Number(browser.pageviews).toLocaleString()} views</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-indigo-600">{percentage}%</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Traffic Sources */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Traffic Sources</h3>
              {referrerSources.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {referrerSources.map((source) => {
                    const totalVisits = referrerSources.reduce((sum, s) => sum + Number(s.visits), 0)
                    const percentage = totalVisits > 0 ? ((Number(source.visits) / totalVisits) * 100).toFixed(1) : '0.0'
                    let icon = '🔗'
                    const sourceLower = source.source.toLowerCase()
                    if (sourceLower === 'direct') icon = '⚡'
                    else if (sourceLower === 'google') icon = '🔍'
                    else if (sourceLower === 'facebook') icon = '📘'
                    else if (sourceLower === 'twitter') icon = '🐦'
                    else if (sourceLower === 'instagram') icon = '📷'
                    else if (sourceLower === 'linkedin') icon = '💼'
                    else if (sourceLower === 'youtube') icon = '📺'
                    else if (sourceLower === 'reddit') icon = '🤖'
                    else if (sourceLower === 'tiktok') icon = '🎵'
                    else if (sourceLower === 'bing') icon = '🔍'
                    else if (sourceLower === 'yahoo') icon = '🔍'
                    else if (sourceLower === 'duckduckgo') icon = '🦆'
                    return (
                      <div key={source.source} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span className="text-lg flex-shrink-0">{icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{source.source}</p>
                            <p className="text-xs text-gray-500">{Number(source.visits).toLocaleString()} visits</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-indigo-600 flex-shrink-0 ml-2">{percentage}%</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Countries */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🌍</span>
                Countries
              </h3>
              {topCountries.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {topCountries.map((country, i) => {
                    const isExpanded = expandedCountry === country.country
                    const cities = countryCities[country.country] || []
                    return (
                      <div key={i}>
                        <div
                          onClick={() => toggleCountry(country.country)}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-lg flex-shrink-0">{getCountryFlag(country.country)}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{getCountryName(country.country)}</p>
                              <p className="text-xs text-gray-500">{Number(country.pageviews).toLocaleString()} views</p>
                            </div>
                          </div>
                          <span className="text-gray-400 transition-transform text-xs" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            ▼
                          </span>
                        </div>
                        {isExpanded && (
                          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                            {cities.length === 0 ? (
                              <p className="text-xs text-gray-400 py-1">Loading cities...</p>
                            ) : (
                              cities.map((city, j) => (
                                <div key={j} className="flex items-center justify-between py-1 px-2 bg-white rounded border border-gray-100">
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

        {/* Footer CTA */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-xl p-6 md:p-8 text-center text-white">
          <h3 className="text-xl md:text-2xl font-bold mb-2">Want analytics like this for your site?</h3>
          <p className="text-indigo-100 mb-4 text-sm md:text-base">
            Simple, privacy-focused analytics for indie hackers. No cookies, no tracking scripts, just clean data.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-indigo-600 px-6 md:px-8 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-bold hover:bg-indigo-50 transition shadow-lg"
          >
            Get Started Free &rarr;
          </Link>
        </div>

      </main>
    </div>
  )
}
