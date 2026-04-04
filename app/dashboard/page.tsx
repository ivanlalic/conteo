'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { getCountryFlag, getCountryName } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'

import StatCard from '@/components/dashboard/StatCard'
import RealtimeBadge from '@/components/dashboard/RealtimeBadge'
import DateRangePicker, { type TimePeriod } from '@/components/dashboard/DateRangePicker'
import VisitorChart, { type TrendDataPoint } from '@/components/dashboard/VisitorChart'
import { getGranularityForRange, type ChartMetric } from '@/lib/chart-utils'
import DataTable from '@/components/dashboard/DataTable'
import UxInsightCard from '@/components/dashboard/UxInsightCard'
import ShareModal from '@/components/ShareModal'
import GoalsPanel from '@/components/GoalsPanel'
import ScrollDepthMini from '@/components/dashboard/ScrollDepthMini'
import AITrafficPanel from '@/components/dashboard/AITrafficPanel'
import { isAISource } from '@/lib/ai-sources'

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface ChartData {
  date: string
  pageviews: number
  unique_visitors: number
}

interface TrendChartData {
  bucket: string
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
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
  pageviews: number
  unique_visitors: number
}

interface AITrafficData {
  ai_source: string
  ai_type: string
  visitors: number
  pageviews: number
  percentage: number
}

interface BehaviorMetric {
  event_type: string
  rate: number
  affected_sessions: number
}

interface BehaviorDetail {
  page_url: string
  element_info: string
  element_tag: string
  occurrences: number
  unique_sessions: number
}

interface ActiveFilters {
  page?: string
  source?: string
  country?: string
  device?: string
  browser?: string
  os?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
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

  const duration = end.getTime() - start.getTime()
  const prevEnd = new Date(start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - duration)

  return { start, end, prevStart, prevEnd }
}

function getSourceIcon(source: string): string {
  const s = source.toLowerCase()
  if (s === 'direct') return '⚡'
  // AI Sources
  if (s.includes('chatgpt')) return '✨'
  if (s.includes('claude')) return '✨'
  if (s.includes('perplexity')) return '✨'
  if (s.includes('gemini')) return '✨'
  if (s.includes('copilot')) return '✨'
  if (s.includes('deepseek')) return '✨'
  if (s.includes('poe')) return '✨'
  if (s === 'you.com') return '✨'
  if (s.includes('kagi')) return '✨'
  if (s.includes('phind')) return '✨'
  // Search & Social
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

// ─── Dashboard Content ────────────────────────────────────────────────────────

function DashboardContent() {
  const { signOut } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Site state
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [loading, setLoading] = useState(true)

  // Period
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Active filters
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({})

  // Aggregate stats
  const [liveUsers, setLiveUsers] = useState(0)
  const [currentVisitors, setCurrentVisitors] = useState(0)
  const [currentPageviews, setCurrentPageviews] = useState(0)
  const [prevVisitors, setPrevVisitors] = useState(0)
  const [prevPageviews, setPrevPageviews] = useState(0)
  const [avgDuration, setAvgDuration] = useState(0)
  const [prevAvgDuration, setPrevAvgDuration] = useState(0)
  const [bounceRate, setBounceRate] = useState(0)

  // Chart
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [comparisonChartData, setComparisonChartData] = useState<ChartData[]>([])
  const [trendData, setTrendData] = useState<TrendChartData[]>([])
  const [comparisonTrendData, setComparisonTrendData] = useState<TrendChartData[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [chartMetric, setChartMetric] = useState<ChartMetric>('visitors')

  // Tables
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [referrerSources, setReferrerSources] = useState<ReferrerSource[]>([])
  const [topCountries, setTopCountries] = useState<TopCountry[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([])
  const [browserBreakdown, setBrowserBreakdown] = useState<BrowserBreakdown[]>([])
  const [osBreakdown, setOsBreakdown] = useState<OSBreakdown[]>([])

  // AI Traffic
  const [aiTrafficData, setAiTrafficData] = useState<AITrafficData[]>([])

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loadingMoreCampaigns, setLoadingMoreCampaigns] = useState(false)
  const [campaignsOffset, setCampaignsOffset] = useState(0)
  const [hasMoreCampaigns, setHasMoreCampaigns] = useState(false)

  // UX Behavior
  const [behaviorSummary, setBehaviorSummary] = useState<BehaviorMetric[]>([])
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null)
  const [behaviorDetails, setBehaviorDetails] = useState<BehaviorDetail[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Country city drill-down
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  const [countryCities, setCountryCities] = useState<Record<string, City[]>>({})
  const [loadingCities, setLoadingCities] = useState<string | null>(null)
  const [countriesLimit, setCountriesLimit] = useState(5)

  // Share modal
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // Init: load sites + read URL filters
  useEffect(() => {
    loadSites()
    // Restore filters from URL
    const filters: ActiveFilters = {}
    if (searchParams.get('page')) filters.page = searchParams.get('page')!
    if (searchParams.get('source')) filters.source = searchParams.get('source')!
    if (searchParams.get('country')) filters.country = searchParams.get('country')!
    if (searchParams.get('device')) filters.device = searchParams.get('device')!
    if (searchParams.get('browser')) filters.browser = searchParams.get('browser')!
    if (searchParams.get('os')) filters.os = searchParams.get('os')!
    if (Object.keys(filters).length > 0) setActiveFilters(filters)
  }, [])

  // Reload data when site / period changes
  useEffect(() => {
    if (selectedSite) loadAllData()
  }, [selectedSite, timePeriod, customStartDate, customEndDate])

  // Live users refresh every 30s
  useEffect(() => {
    if (!selectedSite) return
    const iv = setInterval(() => {
      supabase.rpc('get_live_users', { site_uuid: selectedSite.id }).then(({ data }) => {
        if (data !== null) setLiveUsers(data)
      })
    }, 30_000)
    return () => clearInterval(iv)
  }, [selectedSite])

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(activeFilters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
  }, [activeFilters])

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
    } catch {
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
    const { granularity } = getGranularityForRange(timePeriod)

    const [
      liveRes,
      chartRes,
      compChartRes,
      trendRes,
      compTrendRes,
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
      osRes,
      campaignsRes,
      behaviorRes,
      scrollDepthRes,
      aiTrafficRes,
    ] = await Promise.all([
      supabase.rpc('get_live_users', { site_uuid: selectedSite.id }),
      supabase.rpc('get_pageviews_chart', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        tz_offset_minutes: tzOffset,
      }),
      supabase.rpc('get_pageviews_chart', {
        site_uuid: selectedSite.id,
        start_date: prevStart.toISOString(),
        end_date: prevEnd.toISOString(),
        tz_offset_minutes: tzOffset,
      }),
      supabase.rpc('get_trend_chart', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        granularity,
        tz_offset_minutes: tzOffset,
      }),
      supabase.rpc('get_trend_chart', {
        site_uuid: selectedSite.id,
        start_date: prevStart.toISOString(),
        end_date: prevEnd.toISOString(),
        granularity,
        tz_offset_minutes: tzOffset,
      }),
      supabase.rpc('get_unique_visitors', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      }),
      supabase.rpc('get_unique_visitors', {
        site_uuid: selectedSite.id,
        start_date: prevStart.toISOString(),
        end_date: prevEnd.toISOString(),
      }),
      supabase
        .from('pageviews')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', selectedSite.id)
        .gte('timestamp', start.toISOString())
        .lte('timestamp', end.toISOString()),
      supabase
        .from('pageviews')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', selectedSite.id)
        .gte('timestamp', prevStart.toISOString())
        .lte('timestamp', prevEnd.toISOString()),
      supabase.rpc('get_avg_session_duration', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      }),
      supabase.rpc('get_avg_session_duration', {
        site_uuid: selectedSite.id,
        start_date: prevStart.toISOString(),
        end_date: prevEnd.toISOString(),
      }),
      supabase.rpc('get_top_pages_with_devices', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        page_limit: 20,
      }),
      supabase.rpc('get_referrer_sources', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        source_limit: 20,
      }),
      supabase.rpc('get_top_countries', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        country_limit: 20,
      }),
      supabase.rpc('get_device_breakdown', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      }),
      supabase.rpc('get_browser_breakdown', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      }),
      supabase.rpc('get_os_breakdown', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      }),
      supabase.rpc('get_top_campaigns', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        campaign_limit: 10,
        campaign_offset: 0,
      }),
      supabase.rpc('get_behavior_summary', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      }),
      supabase.rpc('get_scroll_depth_summary', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      }),
      supabase.rpc('get_ai_traffic_summary', {
        site_uuid: selectedSite.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      }),
    ])

    setLiveUsers(liveRes.data || 0)
    setChartData(chartRes.data || [])
    setComparisonChartData(compChartRes.data || [])
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
    setTopCountries(countriesRes.data || [])
    setDeviceBreakdown(devicesRes.data || [])
    setBrowserBreakdown(browsersRes.data || [])
    setOsBreakdown(osRes.data || [])

    const campaignsData: Campaign[] = campaignsRes.data || []
    setCampaigns(campaignsData)
    setCampaignsOffset(10)
    setHasMoreCampaigns(campaignsData.length === 10)

    setBehaviorSummary(behaviorRes.data || [])
    setAiTrafficData(aiTrafficRes.data || [])
    setExpandedMetric(null)
    setBehaviorDetails([])
  }

  async function toggleCountry(countryCode: string) {
    if (expandedCountry === countryCode) {
      setExpandedCountry(null)
      return
    }
    setExpandedCountry(countryCode)
    if (countryCities[countryCode] || !selectedSite) return

    setLoadingCities(countryCode)
    const { start, end } = getPeriodDates(timePeriod, customStartDate, customEndDate)
    const { data } = await supabase.rpc('get_cities_by_country', {
      site_uuid: selectedSite.id,
      country_code: countryCode,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      city_limit: 8,
    })
    if (data) setCountryCities((prev) => ({ ...prev, [countryCode]: data }))
    setLoadingCities(null)
  }

  function applyFilter(dimension: keyof ActiveFilters, value: string) {
    setActiveFilters((prev) =>
      prev[dimension] === value
        ? { ...prev, [dimension]: undefined }
        : { ...prev, [dimension]: value }
    )
  }

  function removeFilter(dimension: keyof ActiveFilters) {
    setActiveFilters((prev) => {
      const next = { ...prev }
      delete next[dimension]
      return next
    })
  }

  async function loadMoreCampaigns() {
    if (!selectedSite) return
    setLoadingMoreCampaigns(true)
    const { start, end } = getPeriodDates(timePeriod, customStartDate, customEndDate)
    const { data } = await supabase.rpc('get_top_campaigns', {
      site_uuid: selectedSite.id,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      campaign_limit: 10,
      campaign_offset: campaignsOffset,
    })
    const newData: Campaign[] = data || []
    setCampaigns((prev) => [...prev, ...newData])
    setCampaignsOffset((prev) => prev + 10)
    setHasMoreCampaigns(newData.length === 10)
    setLoadingMoreCampaigns(false)
  }

  async function toggleBehaviorMetric(eventType: string) {
    if (expandedMetric === eventType) {
      setExpandedMetric(null)
      setBehaviorDetails([])
      return
    }
    setExpandedMetric(eventType)
    if (!selectedSite) return
    setLoadingDetails(true)
    const { start, end } = getPeriodDates(timePeriod, customStartDate, customEndDate)
    const { data } = await supabase.rpc('get_behavior_details', {
      site_uuid: selectedSite.id,
      p_event_type: eventType,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      detail_limit: 10,
    })
    setBehaviorDetails(data || [])
    setLoadingDetails(false)
  }

  function getBehaviorMetric(type: string): BehaviorMetric {
    return behaviorSummary.find((m) => m.event_type === type) || { event_type: type, rate: 0, affected_sessions: 0 }
  }

  // Computed
  const totalVisitors = Math.max(currentVisitors, 1)
  const viewsPerVisit = currentVisitors > 0 ? currentPageviews / currentVisitors : 0
  const prevViewsPerVisit = prevVisitors > 0 ? prevPageviews / prevVisitors : 0
  const hasFilters = Object.values(activeFilters).some(Boolean)

  const filterDimensions: { key: keyof ActiveFilters; label: string }[] = [
    { key: 'page', label: 'Page' },
    { key: 'source', label: 'Source' },
    { key: 'country', label: 'Country' },
    { key: 'device', label: 'Device' },
    { key: 'browser', label: 'Browser' },
    { key: 'os', label: 'OS' },
  ]

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <p className="text-text-tertiary text-sm">Loading…</p>
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
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left */}
          <div className="flex items-center gap-4 min-w-0">
            {sites.length === 1 ? (
              <span className="text-sm font-semibold text-text-primary truncate">
                {selectedSite?.domain}
              </span>
            ) : (
              <select
                value={selectedSite?.id || ''}
                onChange={(e) => {
                  const s = sites.find((s) => s.id === e.target.value)
                  if (s) setSelectedSite(s)
                }}
                className="text-sm font-semibold text-text-primary bg-transparent border-none outline-none cursor-pointer"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.domain}
                  </option>
                ))}
              </select>
            )}
            <RealtimeBadge count={liveUsers} />
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-md transition-colors"
              title="Share public dashboard"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" />
              </svg>
              Share
            </button>
          </div>

          {/* Right */}
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
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1A.5.5 0 018 1zm3.354 2.354a.5.5 0 010 .707l-.708.708a.5.5 0 11-.707-.708l.708-.707a.5.5 0 01.707 0zM14 7.5a.5.5 0 010 1h-1a.5.5 0 010-1h1zm-1.646 3.854a.5.5 0 010-.707l.708-.708a.5.5 0 01.707.708l-.708.707a.5.5 0 01-.707 0zM8 13a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1A.5.5 0 018 13zm-3.354-2.354a.5.5 0 010-.707l.708-.708a.5.5 0 11.707.708l-.708.707a.5.5 0 01-.707 0zM3 7.5a.5.5 0 010 1H2a.5.5 0 010-1h1zm.646-3.146a.5.5 0 01.707 0l.708.707a.5.5 0 11-.708.708L3.646 5.06a.5.5 0 010-.707zM8 5a3 3 0 100 6 3 3 0 000-6z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6 .278a.768.768 0 01.08.858 7.208 7.208 0 00-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 01.81.316.733.733 0 01-.031.893A8.349 8.349 0 018.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 016 .278z" />
                </svg>
              )}
            </button>

            <Link href="/sites" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Sites
            </Link>
            <button onClick={signOut} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2">
            {filterDimensions.map(({ key, label }) =>
              activeFilters[key] ? (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-primary text-primary bg-primary-light"
                >
                  {label}: {activeFilters[key]}
                  <button
                    onClick={() => removeFilter(key)}
                    className="hover:opacity-70 transition-opacity font-bold"
                  >
                    ✕
                  </button>
                </span>
              ) : null
            )}
            <button
              onClick={() => setActiveFilters({})}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors px-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Stat cards */}
        <section className="flex flex-wrap gap-0 -mx-2 sm:mx-0">
          <StatCard
            label="Unique visitors"
            value={formatNumber(currentVisitors)}
            delta={calcDelta(currentVisitors, prevVisitors)}
            tooltip="Personas únicas que visitaron tu sitio en este período. Se identifica por una combinación anónima de IP + user agent, sin cookies."
          />
          <StatCard
            label="Total pageviews"
            value={formatNumber(currentPageviews)}
            delta={calcDelta(currentPageviews, prevPageviews)}
            tooltip="Número total de páginas vistas. Un mismo visitante puede generar múltiples pageviews."
          />
          <StatCard
            label="Bounce rate"
            value={bounceRate > 0 ? `${Math.round(bounceRate)}%` : '--'}
            tooltip="Porcentaje de visitantes que vieron solo una página y se fueron. Menor es mejor."
          />
          <StatCard
            label="Visit duration"
            value={formatDuration(avgDuration)}
            delta={calcDelta(avgDuration, prevAvgDuration)}
            tooltip="Tiempo promedio que los visitantes pasan en tu sitio por sesión. Se calcula como diferencia entre el primer y último pageview de cada sesión, con ventana de 30 minutos de inactividad."
          />
          <StatCard
            label="Views / visit"
            value={viewsPerVisit > 0 ? viewsPerVisit.toFixed(1) : '--'}
            delta={calcDelta(viewsPerVisit, prevViewsPerVisit)}
            tooltip="Promedio de páginas vistas por cada sesión. Más alto = mayor engagement con tu contenido."
          />
          {aiTrafficData.filter(d => d.ai_type === 'human').length > 0 && (
            <StatCard
              label="AI traffic"
              value={(() => {
                const humanAI = aiTrafficData.filter(d => d.ai_type === 'human')
                const totalAIVisitors = humanAI.reduce((sum, d) => sum + d.visitors, 0)
                return formatNumber(totalAIVisitors)
              })()}
              tooltip="Visitantes que llegaron a tu sitio desde herramientas de AI como ChatGPT, Claude, Perplexity, etc."
            />
          )}
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

        {/* Top pages + Top sources */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Top pages"
              tooltip="Las páginas más visitadas de tu sitio, ordenadas por cantidad de visitantes únicos."
              columns={[
                {
                  key: 'path',
                  label: 'Page',
                  render: (val: string) => (
                    <span
                      className={`truncate block max-w-[220px] ${activeFilters.page === val ? 'text-primary font-medium' : ''}`}
                      title={val}
                    >
                      {val}
                    </span>
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
              onRowClick={(row: TopPage) => applyFilter('page', row.path)}
              emptyMessage="No pageviews yet"
            />
          </div>

          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Top sources"
              tooltip="De dónde vienen tus visitantes."
              columns={[
                {
                  key: 'source',
                  label: 'Source',
                  render: (val: string) => (
                    <span className={`flex items-center gap-1.5 ${activeFilters.source === val ? 'text-primary font-medium' : ''}`}>
                      <span>{getSourceIcon(val)}</span>
                      <span className="truncate max-w-[160px]">{val}</span>
                      {isAISource(val) && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          AI
                        </span>
                      )}
                      {(val === 'Direct' || val.includes('Direct')) && (
                        <span className="group relative inline-flex items-center">
                          <svg className="w-3.5 h-3.5 text-text-tertiary cursor-help" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs font-normal text-text-primary bg-bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                            Tráfico sin referrer: URL directa, bookmarks, WhatsApp, email, etc.
                          </span>
                        </span>
                      )}
                    </span>
                  ),
                },
                { key: 'unique_visitors', label: 'Visitors', align: 'right' },
                {
                  key: '_pct',
                  label: '%',
                  align: 'right',
                  render: (_: any, row: ReferrerSource) =>
                    `${Math.round((row.unique_visitors / totalVisitors) * 100)}%`,
                },
              ]}
              data={referrerSources}
              maxKey="unique_visitors"
              onRowClick={(row: ReferrerSource) => applyFilter('source', row.source)}
              emptyMessage="No referrers yet"
            />
          </div>
        </section>

        {/* AI Traffic Panel */}
        {aiTrafficData.length > 0 && (
          <AITrafficPanel data={aiTrafficData} />
        )}

        {/* Countries + Devices */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Countries with city drill-down */}
          <div className="border border-border rounded-lg bg-bg-card p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center">
              Countries
            </h3>
            {topCountries.length === 0 ? (
              <p className="text-sm text-text-tertiary py-4">No country data yet</p>
            ) : (
              <>
                <div className="data-table">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="pb-2 text-left pr-2">Country</th>
                        <th className="pb-2 text-right pr-2">Visitors</th>
                        <th className="pb-2 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCountries.slice(0, countriesLimit).map((row, i) => {
                      const isExpanded = expandedCountry === row.country
                      const cities = countryCities[row.country] || []
                      const maxVisitors = Math.max(...topCountries.map(r => r.unique_visitors), 1)
                      return (
                        <>
                          <tr
                            key={row.country}
                            className={`group relative cursor-pointer ${activeFilters.country === row.country ? 'text-primary' : ''}`}
                            onClick={() => {
                              toggleCountry(row.country)
                              applyFilter('country', row.country)
                            }}
                          >
                            <td className="py-2 pr-2 relative">
                              <div
                                className="absolute inset-y-0 left-0 rounded-sm transition-all duration-[400ms] ease-out group-hover:opacity-[0.18]"
                                style={{
                                  width: `${(row.unique_visitors / maxVisitors) * 100}%`,
                                  background: 'var(--color-primary)',
                                  opacity: 0.08,
                                }}
                              />
                              <span className="relative z-10 flex items-center gap-1.5">
                                <span>{getCountryFlag(row.country)}</span>
                                <span>{getCountryName(row.country) || row.country}</span>
                                <span className="text-text-tertiary text-xs ml-0.5">
                                  {isExpanded ? '▲' : '▼'}
                                </span>
                              </span>
                            </td>
                            <td className="py-2 pr-2 text-right relative z-10">
                              {row.unique_visitors.toLocaleString()}
                            </td>
                            <td className="py-2 text-right relative z-10">
                              {Math.round((row.unique_visitors / totalVisitors) * 100)}%
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`cities-${row.country}`}>
                              <td colSpan={3} className="pb-3 pt-0">
                                {loadingCities === row.country ? (
                                  <p className="text-xs text-text-tertiary pl-4 py-1">Loading cities…</p>
                                ) : cities.length === 0 ? (
                                  <p className="text-xs text-text-tertiary pl-4 py-1">No city data available</p>
                                ) : (
                                  <div className="pl-4 space-y-0.5 border-l border-border ml-2">
                                    {cities.map((city) => (
                                      <div
                                        key={city.city}
                                        className="flex items-center justify-between text-xs py-0.5"
                                      >
                                        <span className="text-text-secondary">{city.city}</span>
                                        <span className="text-text-tertiary">{city.unique_visitors.toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
                {topCountries.length > 5 && (
                  <button
                    onClick={() => setCountriesLimit(countriesLimit === 5 ? topCountries.length : 5)}
                    className="w-full mt-2 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-md transition-colors"
                  >
                    {countriesLimit === 5 ? `Show all countries (${topCountries.length})` : 'Show less'}
                  </button>
                )}
              </div>
              </>
            )}
          </div>

          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Devices"
              tooltip="Tipo de dispositivo usado para acceder a tu sitio, detectado por el user agent del navegador."
              columns={[
                {
                  key: 'device',
                  label: 'Device',
                  render: (val: string) => (
                    <span className={`flex items-center gap-1.5 ${activeFilters.device === val ? 'text-primary font-medium' : ''}`}>
                      {val}
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
              onRowClick={(row: DeviceBreakdown) => applyFilter('device', row.device)}
              emptyMessage="No device data yet"
            />
          </div>
        </section>

        {/* Browsers + OS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Browsers"
              tooltip="Navegador web utilizado por tus visitantes."
              columns={[
                {
                  key: 'browser',
                  label: 'Browser',
                  render: (val: string) => (
                    <span className={activeFilters.browser === val ? 'text-primary font-medium' : ''}>
                      {val}
                    </span>
                  ),
                },
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
              onRowClick={(row: BrowserBreakdown) => applyFilter('browser', row.browser)}
              emptyMessage="No browser data yet"
            />
          </div>

          <div className="border border-border rounded-lg bg-bg-card p-4">
            <DataTable
              title="Operating systems"
              tooltip="Sistema operativo del dispositivo de tus visitantes."
              columns={[
                {
                  key: 'os',
                  label: 'OS',
                  render: (val: string) => (
                    <span className={`flex items-center gap-1.5 ${activeFilters.os === val ? 'text-primary font-medium' : ''}`}>
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
              onRowClick={(row: OSBreakdown) => applyFilter('os', row.os)}
              emptyMessage="No OS data yet"
            />
          </div>
        </section>

        {/* UX Insights */}
        <section className="border border-border rounded-lg bg-bg-card p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">UX Insights</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            <UxInsightCard
              label="Rage clicks"
              rate={getBehaviorMetric('rage_click').rate}
              sessions={getBehaviorMetric('rage_click').affected_sessions}
              tooltip="Percentage of sessions where a visitor clicked 3+ times rapidly in the same area without getting a response. Indicates frustration: broken buttons, elements that look clickable but aren't, or high latency."
              thresholds={[2, 5]}
              isExpanded={expandedMetric === 'rage_click'}
              onClick={() => toggleBehaviorMetric('rage_click')}
            />
            <UxInsightCard
              label="Dead clicks"
              rate={getBehaviorMetric('dead_click').rate}
              sessions={getBehaviorMetric('dead_click').affected_sessions}
              tooltip="Percentage of sessions where a visitor clicked on an element that produced no response. Indicates elements that look interactive but aren't, broken links, or JavaScript errors."
              thresholds={[10, 25]}
              isExpanded={expandedMetric === 'dead_click'}
              onClick={() => toggleBehaviorMetric('dead_click')}
            />
            <UxInsightCard
              label="Excessive scrolling"
              rate={getBehaviorMetric('excessive_scroll').rate}
              sessions={getBehaviorMetric('excessive_scroll').affected_sessions}
              tooltip="Percentage of sessions where a visitor scrolled much more than normal, going up and down repeatedly or reaching the bottom of very long pages. Indicates that the visitor can't find what they're looking for or that the content is poorly organized."
              thresholds={[3, 10]}
              isExpanded={expandedMetric === 'excessive_scroll'}
              onClick={() => toggleBehaviorMetric('excessive_scroll')}
            />
            <UxInsightCard
              label="Quick backs"
              rate={getBehaviorMetric('quick_back').rate}
              sessions={getBehaviorMetric('quick_back').affected_sessions}
              tooltip="Percentage of sessions where a visitor navigated to a page and returned to the previous one in less than 5 seconds. Indicates that the content or navigation wasn't what the visitor expected — like opening a door, looking inside, and leaving immediately."
              thresholds={[5, 15]}
              isExpanded={expandedMetric === 'quick_back'}
              onClick={() => toggleBehaviorMetric('quick_back')}
            />
          </div>
          {expandedMetric && (
            <div className="mt-4 pt-4 border-t border-border">
              {loadingDetails ? (
                <p className="text-sm text-text-tertiary py-2">Loading details…</p>
              ) : behaviorDetails.length === 0 ? (
                <p className="text-sm text-text-tertiary py-2">No data yet for this metric.</p>
              ) : (
                <DataTable
                  title={
                    expandedMetric === 'rage_click' ? 'Top rage click elements' :
                    expandedMetric === 'dead_click' ? 'Top dead click elements' :
                    expandedMetric === 'excessive_scroll' ? 'Pages with excessive scrolling' :
                    'Top quick back page pairs'
                  }
                  columns={
                    expandedMetric === 'quick_back'
                      ? [
                          { key: 'page_url', label: 'From page', render: (val: string) => <span className="truncate block max-w-[200px]" title={val}>{val}</span> },
                          { key: 'element_info', label: 'To page', render: (val: string) => <span className="truncate block max-w-[200px]" title={val}>{val}</span> },
                          { key: 'occurrences', label: 'Count', align: 'right' as const },
                          { key: 'unique_sessions', label: 'Sessions', align: 'right' as const },
                        ]
                      : expandedMetric === 'excessive_scroll'
                      ? [
                          { key: 'page_url', label: 'Page', render: (val: string) => <span className="truncate block max-w-[300px]" title={val}>{val}</span> },
                          { key: 'occurrences', label: 'Count', align: 'right' as const },
                          { key: 'unique_sessions', label: 'Sessions', align: 'right' as const },
                        ]
                      : [
                          { key: 'page_url', label: 'Page', render: (val: string) => <span className="truncate block max-w-[160px]" title={val}>{val}</span> },
                          { key: 'element_info', label: 'Element', render: (val: string) => <span className="truncate block max-w-[160px] text-text-secondary" title={val}>{val || '—'}</span> },
                          { key: 'element_tag', label: 'Tag', render: (val: string) => val ? <code className="bg-border-light px-1 rounded text-xs">{val}</code> : '—' },
                          { key: 'occurrences', label: 'Count', align: 'right' as const },
                          { key: 'unique_sessions', label: 'Sessions', align: 'right' as const },
                        ]
                  }
                  data={behaviorDetails}
                  maxKey="occurrences"
                  onRowClick={expandedMetric !== 'excessive_scroll' && expandedMetric !== 'quick_back' ? (row: BehaviorDetail) => applyFilter('page', row.page_url) : undefined}
                  emptyMessage="No data yet"
                />
              )}
            </div>
          )}
        </section>

        {/* Goals — conversions tracking */}
        {selectedSite && (
          <GoalsPanel
            siteId={selectedSite.id}
            startDate={getPeriodDates(timePeriod, customStartDate, customEndDate).start.toISOString()}
            endDate={getPeriodDates(timePeriod, customStartDate, customEndDate).end.toISOString()}
          />
        )}

        {/* UTM Campaigns — full width */}
        <section className="border border-border rounded-lg bg-bg-card p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">UTM Campaigns</h3>
          {campaigns.length === 0 ? (
            <p className="text-sm text-text-tertiary py-4">
              No UTM campaigns tracked yet.{' '}
              <span className="text-text-secondary">
                Add <code className="bg-border-light px-1 rounded text-xs">utm_*</code> params to your URLs to track campaigns.
              </span>
            </p>
          ) : (
            <>
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
              {hasMoreCampaigns && (
                <button
                  onClick={loadMoreCampaigns}
                  disabled={loadingMoreCampaigns}
                  className="mt-3 text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {loadingMoreCampaigns ? 'Loading…' : 'Load more'}
                </button>
              )}
            </>
          )}
        </section>

      </main>

      {/* Share Modal */}
      {selectedSite && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          siteId={selectedSite.id}
          siteDomain={selectedSite.domain}
        />
      )}
    </div>
  )
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
