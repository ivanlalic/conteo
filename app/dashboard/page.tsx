'use client'

import { useEffect, useState, Fragment } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import PageviewsChart from '@/components/PageviewsChart'
import { getCountryFlag, getCountryName } from '@/lib/utils'
import InfoTooltip from '@/components/InfoTooltip'

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

interface Campaign {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
  pageviews: number
  unique_visitors: number
}

interface ActivityItem {
  path: string
  country: string
  browser: string
  device: string
  visit_time: string
}

interface SiteShare {
  id: string
  site_id: string
  share_token: string
  is_public: boolean
}

interface CODConversion {
  product_name: string
  source: string
  views: number
  forms: number
  purchases: number
  revenue: number
}

interface CustomEvent {
  event_name: string
  total_events: number
  unique_visitors: number
  conversion_rate: number
}

interface EventBreakdownSource {
  source: string
  event_count: number
  unique_visitors: number
}

interface EventBreakdownPage {
  path: string
  event_count: number
  unique_visitors: number
}

interface EventBreakdownDevice {
  device: string
  event_count: number
  unique_visitors: number
}

interface EventBreakdownProperty {
  property_key: string
  property_value: string
  event_count: number
  unique_visitors: number
}

interface EventDetails {
  sources: EventBreakdownSource[]
  pages: EventBreakdownPage[]
  devices: EventBreakdownDevice[]
  properties: EventBreakdownProperty[]
}

function DashboardContent() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [stats, setStats] = useState({
    liveUsers: 0,
    todayViews: 0,
    weekViews: 0,
    monthViews: 0,
    avgSessionDurationAll: 0,
    avgSessionDurationMulti: 0,
  })
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [referrerSources, setReferrerSources] = useState<ReferrerSource[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([])
  const [browserBreakdown, setBrowserBreakdown] = useState<BrowserBreakdown[]>([])
  const [topCountries, setTopCountries] = useState<TopCountry[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignsOffset, setCampaignsOffset] = useState(0)
  const [hasMoreCampaigns, setHasMoreCampaigns] = useState(true)
  const [loadingMoreCampaigns, setLoadingMoreCampaigns] = useState(false)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [trackerUrl, setTrackerUrl] = useState('')
  const [timePeriod, setTimePeriod] = useState<'today' | '7days' | '30days' | 'custom'>('7days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  const [countryCities, setCountryCities] = useState<{ [key: string]: City[] }>({})
  const [siteShare, setSiteShare] = useState<SiteShare | null>(null)
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  const [codConversions, setCodConversions] = useState<CODConversion[]>([])
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([])
  const [showEventsGuide, setShowEventsGuide] = useState(false)
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [eventDetails, setEventDetails] = useState<{ [eventName: string]: EventDetails }>({})
  const [loadingEventDetails, setLoadingEventDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'cod' | 'events' | 'campaigns' | 'activity'>('overview')

  useEffect(() => {
    loadSites()
    // Get the current app URL for the tracking snippet
    if (typeof window !== 'undefined') {
      setTrackerUrl(`${window.location.origin}/tracker.js`)
    }
  }, [])

  useEffect(() => {
    if (selectedSite) {
      // Reset campaigns when period changes
      setCampaigns([])
      setCampaignsOffset(0)
      setHasMoreCampaigns(true)
      loadStats()
      loadSiteShare()
    }
  }, [selectedSite, timePeriod])

  function getPeriodLabel() {
    if (timePeriod === 'today') return 'Today'
    if (timePeriod === '7days') return 'Last 7 Days'
    return 'Last 30 Days'
  }

  async function toggleCountry(countryCode: string) {
    // If clicking the same country, collapse it
    if (expandedCountry === countryCode) {
      setExpandedCountry(null)
      return
    }

    // Expand the country
    setExpandedCountry(countryCode)

    // If we already have cities for this country, don't reload
    if (countryCities[countryCode]) {
      return
    }

    // Load cities for this country
    if (!selectedSite) return

    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      let periodStart: Date
      let periodEnd: Date = now

      if (timePeriod === 'custom') {
        if (customStartDate && customEndDate) {
          periodStart = new Date(customStartDate + 'T00:00:00')
          periodEnd = new Date(customEndDate + 'T23:59:59')
        } else {
          periodStart = weekAgo
        }
      } else if (timePeriod === 'today') {
        periodStart = today
      } else if (timePeriod === '7days') {
        periodStart = weekAgo
      } else {
        periodStart = monthAgo
      }

      const { data: citiesData, error } = await supabase
        .rpc('get_cities_by_country', {
          site_uuid: selectedSite.id,
          country_code: countryCode,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString(),
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

  async function loadSites() {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, domain, api_key, cod_tracking_enabled')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSites(data || [])

      // Auto-select first site
      if (data && data.length > 0) {
        setSelectedSite(data[0])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading sites:', error)
      setLoading(false)
    }
  }

  async function loadStats() {
    if (!selectedSite) return

    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Calculate period start date based on selected time period
      let periodStart: Date
      let periodEnd: Date = now

      if (timePeriod === 'custom') {
        // Use custom date range
        if (customStartDate && customEndDate) {
          periodStart = new Date(customStartDate + 'T00:00:00')
          periodEnd = new Date(customEndDate + 'T23:59:59')
        } else {
          // Fallback to 7 days if custom dates not set
          periodStart = weekAgo
        }
      } else if (timePeriod === 'today') {
        periodStart = today
      } else if (timePeriod === '7days') {
        periodStart = weekAgo
      } else {
        periodStart = monthAgo
      }

      // Live users (last 5 minutes)
      const { data: liveUsersData, error: liveError } = await supabase
        .rpc('get_live_users', { site_uuid: selectedSite.id })

      // Today's pageviews
      const { count: todayCount, error: todayError } = await supabase
        .from('pageviews')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', selectedSite.id)
        .gte('timestamp', today.toISOString())

      // Week's pageviews
      const { count: weekCount, error: weekError } = await supabase
        .from('pageviews')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', selectedSite.id)
        .gte('timestamp', weekAgo.toISOString())

      // Month's pageviews
      const { count: monthCount, error: monthError } = await supabase
        .from('pageviews')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', selectedSite.id)
        .gte('timestamp', monthAgo.toISOString())

      // Top pages with device breakdown (uses selected period)
      const { data: topPagesData, error: pagesError } = await supabase
        .rpc('get_top_pages_with_devices', {
          site_uuid: selectedSite.id,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString(),
          page_limit: 5
        })

      // Device breakdown (uses selected period)
      const { data: deviceData, error: deviceError } = await supabase
        .rpc('get_device_breakdown', {
          site_uuid: selectedSite.id,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString()
        })

      // Browser breakdown (uses selected period)
      const { data: browserData, error: browserError } = await supabase
        .rpc('get_browser_breakdown', {
          site_uuid: selectedSite.id,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString()
        })

      // Referrer sources (uses selected period)
      const { data: referrerSourcesData, error: referrersError } = await supabase
        .rpc('get_referrer_sources', {
          site_uuid: selectedSite.id,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString(),
          source_limit: 5
        })

      // Top countries (uses selected period)
      const { data: topCountriesData, error: countriesError } = await supabase
        .rpc('get_top_countries', {
          site_uuid: selectedSite.id,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString(),
          country_limit: 5
        })

      // Chart data (uses selected period like other sections)
      // Get user's timezone offset in minutes (inverted because getTimezoneOffset returns negative for positive offsets)
      const timezoneOffsetMinutes = -new Date().getTimezoneOffset()

      const { data: chartDataRaw, error: chartError } = await supabase
        .rpc('get_pageviews_chart', {
          site_uuid: selectedSite.id,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString(),
          tz_offset_minutes: timezoneOffsetMinutes
        })

      // Average session duration (uses selected period)
      const { data: avgDurationData, error: avgDurationError } = await supabase
        .rpc('get_avg_session_duration', {
          site_uuid: selectedSite.id,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString()
        })

      const durationData = avgDurationData?.[0] || { avg_duration_all: 0, avg_duration_multi_page: 0 }

      setStats({
        liveUsers: liveUsersData || 0,
        todayViews: todayCount || 0,
        weekViews: weekCount || 0,
        monthViews: monthCount || 0,
        avgSessionDurationAll: durationData.avg_duration_all || 0,
        avgSessionDurationMulti: durationData.avg_duration_multi_page || 0,
      })

      // Top campaigns (first 5)
      const { data: campaignsData, error: campaignsError } = await supabase
        .rpc('get_top_campaigns', {
          site_uuid: selectedSite.id,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString(),
          campaign_limit: 5,
          campaign_offset: 0
        })

      // Recent activity (last 15 visits)
      const { data: activityData, error: activityError } = await supabase
        .rpc('get_recent_activity', {
          site_uuid: selectedSite.id,
          activity_limit: 15
        })

      setTopPages(topPagesData || [])
      setReferrerSources(referrerSourcesData || [])
      setChartData(chartDataRaw || [])
      setDeviceBreakdown(deviceData || [])
      setBrowserBreakdown(browserData || [])
      setTopCountries(topCountriesData || [])
      setCampaigns(campaignsData || [])
      setRecentActivity(activityData || [])
      setHasMoreCampaigns((campaignsData || []).length === 5)
      setCampaignsOffset(5)

      // Load COD conversions if enabled
      if (selectedSite.cod_tracking_enabled) {
        loadCODConversions(periodStart, periodEnd)
      } else {
        setCodConversions([])
      }

      // Load custom events
      loadCustomEvents(periodStart, periodEnd)

    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  async function loadCODConversions(periodStart: Date, periodEnd: Date) {
    if (!selectedSite) return

    try {
      const { data, error } = await supabase
        .rpc('get_cod_conversions', {
          site_uuid: selectedSite.id,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString()
        })

      if (error) throw error

      setCodConversions(data || [])
    } catch (error) {
      console.error('Error loading COD conversions:', error)
    }
  }

  async function loadCustomEvents(periodStart: Date, periodEnd: Date) {
    if (!selectedSite) return

    try {
      const { data, error} = await supabase
        .rpc('get_custom_events_summary', {
          site_uuid: selectedSite.id,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString()
        })

      if (error) throw error

      setCustomEvents(data || [])
    } catch (error) {
      console.error('Error loading custom events:', error)
    }
  }

  async function toggleEventDetails(eventName: string) {
    if (expandedEvent === eventName) {
      setExpandedEvent(null)
      return
    }

    setExpandedEvent(eventName)

    if (eventDetails[eventName]) {
      return
    }

    if (!selectedSite) return

    try {
      setLoadingEventDetails(true)

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      let periodStart: Date
      let periodEnd: Date = now

      if (timePeriod === 'custom') {
        if (customStartDate && customEndDate) {
          periodStart = new Date(customStartDate + 'T00:00:00')
          periodEnd = new Date(customEndDate + 'T23:59:59')
        } else {
          periodStart = weekAgo
        }
      } else if (timePeriod === 'today') {
        periodStart = today
      } else if (timePeriod === '7days') {
        periodStart = weekAgo
      } else {
        periodStart = monthAgo
      }

      const [sourcesResult, pagesResult, devicesResult, propertiesResult] = await Promise.all([
        supabase.rpc('get_event_breakdown_by_source', {
          site_uuid: selectedSite.id,
          event_name_filter: eventName,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString()
        }),
        supabase.rpc('get_event_breakdown_by_page', {
          site_uuid: selectedSite.id,
          event_name_filter: eventName,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString(),
          page_limit: 5
        }),
        supabase.rpc('get_event_breakdown_by_device', {
          site_uuid: selectedSite.id,
          event_name_filter: eventName,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString()
        }),
        supabase.rpc('get_event_breakdown_by_properties', {
          site_uuid: selectedSite.id,
          event_name_filter: eventName,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString()
        })
      ])

      const details: EventDetails = {
        sources: sourcesResult.data || [],
        pages: pagesResult.data || [],
        devices: devicesResult.data || [],
        properties: propertiesResult.data || []
      }

      setEventDetails(prev => ({
        ...prev,
        [eventName]: details
      }))
    } catch (error) {
      console.error('Error loading event details:', error)
    } finally {
      setLoadingEventDetails(false)
    }
  }

  async function loadMoreCampaigns() {
    if (!selectedSite || loadingMoreCampaigns) return

    try {
      setLoadingMoreCampaigns(true)

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      let periodStart: Date
      let periodEnd: Date = now

      if (timePeriod === 'custom') {
        if (customStartDate && customEndDate) {
          periodStart = new Date(customStartDate + 'T00:00:00')
          periodEnd = new Date(customEndDate + 'T23:59:59')
        } else {
          periodStart = weekAgo
        }
      } else if (timePeriod === 'today') {
        periodStart = today
      } else if (timePeriod === '7days') {
        periodStart = weekAgo
      } else {
        periodStart = monthAgo
      }

      const { data: moreCampaigns, error } = await supabase
        .rpc('get_top_campaigns', {
          site_uuid: selectedSite.id,
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString(),
          campaign_limit: 10,
          campaign_offset: campaignsOffset
        })

      if (!error && moreCampaigns) {
        setCampaigns(prev => [...prev, ...moreCampaigns])
        setCampaignsOffset(prev => prev + moreCampaigns.length)
        setHasMoreCampaigns(moreCampaigns.length === 10)
      }
    } catch (error) {
      console.error('Error loading more campaigns:', error)
    } finally {
      setLoadingMoreCampaigns(false)
    }
  }

  function exportToCSV() {
    if (!selectedSite) return

    // Helper function to escape CSV values
    const escapeCSV = (value: any) => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    // Build CSV content
    let csv = `Analytics Export - ${selectedSite.domain}\n`
    csv += `Export Date: ${new Date().toLocaleString()}\n`
    csv += `Period: ${timePeriod === 'custom' ? `${customStartDate} to ${customEndDate}` : timePeriod}\n\n`

    // Top Pages
    csv += 'TOP PAGES\n'
    csv += 'Page,Pageviews,Desktop Views,Mobile Views,Unique Visitors\n'
    topPages.forEach(page => {
      csv += `${escapeCSV(page.path)},${page.pageviews},${page.desktop_views},${page.mobile_views},${page.unique_visitors}\n`
    })
    csv += '\n'

    // Devices
    csv += 'DEVICES\n'
    csv += 'Device,Pageviews,Unique Visitors\n'
    deviceBreakdown.forEach(device => {
      csv += `${escapeCSV(device.device)},${device.pageviews},${device.unique_visitors}\n`
    })
    csv += '\n'

    // Browsers
    csv += 'BROWSERS\n'
    csv += 'Browser,Pageviews,Unique Visitors\n'
    browserBreakdown.forEach(browser => {
      csv += `${escapeCSV(browser.browser)},${browser.pageviews},${browser.unique_visitors}\n`
    })
    csv += '\n'

    // Countries
    csv += 'COUNTRIES\n'
    csv += 'Country,Pageviews,Unique Visitors\n'
    topCountries.forEach(country => {
      csv += `${escapeCSV(getCountryName(country.country))},${country.pageviews},${country.unique_visitors}\n`
    })
    csv += '\n'

    // Traffic Sources
    csv += 'TRAFFIC SOURCES\n'
    csv += 'Source,Visits,Unique Visitors\n'
    referrerSources.forEach(source => {
      csv += `${escapeCSV(source.source)},${source.visits},${source.unique_visitors}\n`
    })
    csv += '\n'

    // Campaigns
    if (campaigns.length > 0) {
      csv += 'CAMPAIGNS\n'
      csv += 'Campaign,Source,Medium,Pageviews,Unique Visitors\n'
      campaigns.forEach(campaign => {
        csv += `${escapeCSV(campaign.utm_campaign)},${escapeCSV(campaign.utm_source)},${escapeCSV(campaign.utm_medium)},${campaign.pageviews},${campaign.unique_visitors}\n`
      })
      csv += '\n'
    }

    // COD Conversions (pivoted by source)
    if (selectedSite.cod_tracking_enabled && codConversions.length > 0) {
      const conversionsWithPurchases = codConversions.filter(c => Number(c.purchases) > 0)
      if (conversionsWithPurchases.length > 0) {
        // Get all unique sources
        const allSources = Array.from(new Set(conversionsWithPurchases.map(c => c.source))).sort()

        // Group by product
        const productMap = new Map()
        conversionsWithPurchases.forEach(conversion => {
          if (!productMap.has(conversion.product_name)) {
            productMap.set(conversion.product_name, {
              name: conversion.product_name,
              sources: new Map(),
              totalConversions: 0,
              totalRevenue: 0
            })
          }
          const product = productMap.get(conversion.product_name)
          const conversions = Number(conversion.purchases)
          const revenue = Number(conversion.revenue || 0)
          product.sources.set(conversion.source, { conversions, revenue })
          product.totalConversions += conversions
          product.totalRevenue += revenue
        })

        csv += 'COD CONVERSIONS\n'
        csv += 'Product,' + allSources.join(',') + ',Total Conversions,Total Revenue\n'

        Array.from(productMap.values()).forEach(product => {
          csv += escapeCSV(product.name)
          allSources.forEach(source => {
            const data = product.sources.get(source)
            csv += ',' + (data ? data.conversions : '0')
          })
          csv += ',' + product.totalConversions
          csv += ',€' + product.totalRevenue.toFixed(2) + '\n'
        })
        csv += '\n'
      }
    }

    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `analytics-${selectedSite.domain}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function generateShareToken(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let token = ''
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
  }

  async function loadSiteShare() {
    if (!selectedSite) return

    try {
      const { data, error } = await supabase
        .from('site_shares')
        .select('*')
        .eq('site_id', selectedSite.id)
        .single()

      if (!error && data) {
        setSiteShare(data)
      } else {
        setSiteShare(null)
      }
    } catch (error) {
      console.error('Error loading site share:', error)
      setSiteShare(null)
    }
  }

  async function togglePublicSharing() {
    if (!selectedSite) return

    try {
      if (siteShare) {
        // Toggle existing share
        const newPublicState = !siteShare.is_public
        const { error } = await supabase
          .from('site_shares')
          .update({ is_public: newPublicState })
          .eq('id', siteShare.id)

        if (error) throw error

        setSiteShare({ ...siteShare, is_public: newPublicState })
      } else {
        // Create new share token
        const shareToken = generateShareToken()
        const { data, error } = await supabase
          .from('site_shares')
          .insert({
            site_id: selectedSite.id,
            share_token: shareToken,
            is_public: true
          })
          .select()
          .single()

        if (error) throw error

        setSiteShare(data)
      }
    } catch (error: any) {
      console.error('Error toggling public sharing:', error)
      alert(`Error: ${error.message}`)
    }
  }

  function copyShareLink() {
    if (!siteShare) return
    const shareUrl = `${window.location.origin}/share/${siteShare.share_token}`
    navigator.clipboard.writeText(shareUrl)
    setCopiedShareLink(true)
    setTimeout(() => setCopiedShareLink(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // No sites yet
  if (sites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">conteo.online</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{user?.email}</span>
                <button
                  onClick={signOut}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Welcome to Conteo!</h2>
            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">
              You don't have any sites yet. Let's add your first one to start tracking analytics.
            </p>
            <Link
              href="/sites"
              className="inline-block bg-indigo-600 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-indigo-700 transition"
            >
              Add Your First Site
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">conteo.online</h1>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link
                href="/sites"
                className="text-xs md:text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                My Sites
              </Link>
              <span className="text-xs md:text-sm text-gray-600 hidden sm:inline max-w-[120px] md:max-w-none truncate">{user?.email}</span>
              <button
                onClick={signOut}
                className="bg-gray-200 text-gray-700 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold hover:bg-gray-300 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Site Selector Bar */}
      <div className="bg-indigo-600 border-b border-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="text-indigo-100 text-xs md:text-sm font-medium">Viewing:</span>
              <select
                value={selectedSite?.id || ''}
                onChange={(e) => {
                  const site = sites.find(s => s.id === e.target.value)
                  setSelectedSite(site || null)
                }}
                className="bg-white text-gray-900 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-semibold focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.domain}
                  </option>
                ))}
              </select>
            </div>

            {/* Public Sharing Toggle */}
            <div className="flex items-center space-x-3">
              <span className="text-indigo-100 text-xs font-medium">Public Sharing:</span>
              <button
                onClick={togglePublicSharing}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  siteShare?.is_public ? 'bg-green-500' : 'bg-indigo-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    siteShare?.is_public ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              {siteShare?.is_public && (
                <>
                  <button
                    onClick={copyShareLink}
                    className="text-xs text-white bg-indigo-700 hover:bg-indigo-800 px-3 py-1 rounded font-medium transition"
                  >
                    {copiedShareLink ? '✓ Copied' : 'Copy Link'}
                  </button>
                  <a
                    href={`/share/${siteShare.share_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded font-medium transition"
                  >
                    Visit →
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Grid - Clean (4 main metrics) */}
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

        {/* Time Period Selector & Export */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
          {/* Export CSV Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow-sm"
          >
            <span>📊</span>
            <span>Export CSV</span>
          </button>

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
              <button
                onClick={() => setTimePeriod('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  timePeriod === 'custom'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {timePeriod === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 px-2 py-1.5 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                max={customEndDate || new Date().toISOString().split('T')[0]}
              />
              <span className="text-xs text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 px-2 py-1.5 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                min={customStartDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 min-w-[100px] px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📊 Overview
            </button>

            {selectedSite?.cod_tracking_enabled && (
              <button
                onClick={() => setActiveTab('cod')}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'cod'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                💰 COD Tracking
              </button>
            )}

            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 min-w-[100px] px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'events'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🎯 Events
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex-1 min-w-[100px] px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'campaigns'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📢 Campaigns
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 min-w-[100px] px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'activity'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ⚡ Activity
            </button>
          </div>
        </div>

        {/* Tab Content: Overview */}
        {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left Column - Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Chart - Compact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Pageviews Chart</h3>
              <div className="h-64">
                <PageviewsChart data={chartData} />
              </div>
            </div>

            {/* Top Pages - Compact Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">Top Pages</h3>
              </div>
              <div className="p-4">
                {topPages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No pageviews yet.
                  </p>
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

        {/* Device Breakdown Card - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Devices
          </h3>
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

        {/* Browser Breakdown Card - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Browsers
          </h3>
          {browserBreakdown.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2">
              {browserBreakdown.map((browser) => {
                const totalViews = browserBreakdown.reduce((sum, b) => sum + Number(b.pageviews), 0)
                const percentage = totalViews > 0 ? ((Number(browser.pageviews) / totalViews) * 100).toFixed(1) : '0.0'

                // Browser icon logic
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

        {/* Referrer Sources Card - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Traffic Sources
          </h3>
          {referrerSources.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2">
              {referrerSources.map((source) => {
                const totalVisits = referrerSources.reduce((sum, s) => sum + Number(s.visits), 0)
                const percentage = totalVisits > 0 ? ((Number(source.visits) / totalVisits) * 100).toFixed(1) : '0.0'

                // Source icon logic
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

        {/* Top Countries Card - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">🌍</span>
            Countries
          </h3>
          {topCountries.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2">
              {topCountries.map((country, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">{getCountryFlag(country.country)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{getCountryName(country.country)}</p>
                      <p className="text-xs text-gray-500">{Number(country.pageviews).toLocaleString()} views</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

          {/* Close Right Column */}
          </div>

        {/* Close 2-Column Layout */}
        </div>
        )}

        {/* Tab Content: COD Tracking */}
        {activeTab === 'cod' && selectedSite?.cod_tracking_enabled && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                COD Conversions
              </h3>
            </div>
            <div className="p-4">
              {codConversions.filter(c => Number(c.purchases) > 0).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No COD conversions tracked yet. Make sure your pixel events are configured correctly.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  {(() => {
                    // Get all unique sources
                    const allSources = Array.from(new Set(
                      codConversions
                        .filter(c => Number(c.purchases) > 0)
                        .map(c => c.source)
                    )).sort()

                    // Source icon mapping
                    const getSourceIcon = (source: string) => {
                      const sourceLower = source.toLowerCase()
                      if (sourceLower === 'direct') return '⚡'
                      if (sourceLower === 'google') return '🔍'
                      if (sourceLower === 'facebook') return '📘'
                      if (sourceLower === 'twitter') return '🐦'
                      if (sourceLower === 'instagram') return '📷'
                      if (sourceLower === 'tiktok') return '🎵'
                      return '🔗'
                    }

                    // Group by product
                    const productMap = new Map<string, {
                      name: string
                      sources: Map<string, { conversions: number, revenue: number }>
                      totalConversions: number
                      totalRevenue: number
                    }>()

                    codConversions
                      .filter(c => Number(c.purchases) > 0)
                      .forEach(conversion => {
                        if (!productMap.has(conversion.product_name)) {
                          productMap.set(conversion.product_name, {
                            name: conversion.product_name,
                            sources: new Map(),
                            totalConversions: 0,
                            totalRevenue: 0
                          })
                        }

                        const product = productMap.get(conversion.product_name)!
                        const conversions = Number(conversion.purchases)
                        const revenue = Number(conversion.revenue || 0)

                        product.sources.set(conversion.source, { conversions, revenue })
                        product.totalConversions += conversions
                        product.totalRevenue += revenue
                      })

                    const products = Array.from(productMap.values())

                    return (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-white">
                              Product
                            </th>
                            {allSources.map(source => (
                              <th key={source} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                <span className="inline-flex flex-col items-center gap-1">
                                  <span className="text-lg">{getSourceIcon(source)}</span>
                                  <span>{source}</span>
                                </span>
                              </th>
                            ))}
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-gray-50">
                              Total Conv.
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-gray-50">
                              Total Revenue
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {products.map((product, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                                {product.name}
                              </td>
                              {allSources.map(source => {
                                const data = product.sources.get(source)
                                return (
                                  <td key={source} className="px-3 py-3 text-center text-sm">
                                    {data ? (
                                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 font-semibold min-w-[2rem]">
                                        {data.conversions}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">-</span>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 bg-gray-50">
                                {product.totalConversions}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-bold text-green-600 bg-gray-50">
                                €{product.totalRevenue.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Custom Events */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Custom Events
              </h3>
            </div>
            <div className="p-4">
              {customEvents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500 mb-6">
                    No custom events tracked yet
                  </p>
                  <div className="bg-gray-50 rounded-lg p-6 max-w-3xl mx-auto text-left space-y-6">
                    {/* What are Custom Events */}
                    <div>
                      <h4 className="text-base font-bold text-gray-900 mb-2">What are Custom Events?</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Custom events let you track specific user actions beyond pageviews.
                        Instead of just knowing <em>which pages</em> users visit, you can track <em>what they do</em> on those pages.
                      </p>
                    </div>

                    {/* Use Cases */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Common use cases:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>• Button clicks ("CTA Click", "Buy Now")</div>
                        <div>• Form submissions ("Contact Form", "Newsletter")</div>
                        <div>• Downloads ("PDF Download", "eBook")</div>
                        <div>• Video plays ("Tutorial Video")</div>
                        <div>• Feature usage ("Filter Applied", "Search")</div>
                        <div>• Signups ("Account Created")</div>
                      </div>
                    </div>

                    {/* Basic Syntax */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 Basic syntax:</h4>
                      <div className="bg-white border border-gray-200 rounded p-3 text-xs font-mono text-gray-700">
                        conteo.trackEvent(<span className="text-green-600">'Event Name'</span>, &#123; props: &#123; key: value &#125; &#125;)
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        <strong>Event Name:</strong> Describe what happened (e.g., "Button Click")
                        <br />
                        <strong>Properties (optional):</strong> Add context like which button, file name, etc.
                      </p>
                    </div>

                    {/* Examples */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 Real examples:</h4>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto leading-relaxed">
{`<!-- Example 1: Track button clicks inline -->
<button onclick="conteo.trackEvent('CTA Click')">
  Get Started
</button>

<!-- Example 2: Track with context (which button was clicked) -->
<button onclick="conteo.trackEvent('CTA Click', {
  props: { location: 'hero', label: 'Get Started' }
})">
  Get Started
</button>

<script>
  // Example 3: Track form submissions
  document.getElementById('contact-form').addEventListener('submit', (e) => {
    conteo.trackEvent('Form Submit', {
      props: { form: 'contact' }
    })
  })

  // Example 4: Track file downloads
  document.querySelectorAll('a[download]').forEach(link => {
    link.addEventListener('click', () => {
      conteo.trackEvent('Download', {
        props: {
          file: link.getAttribute('download'),
          format: link.href.split('.').pop()
        }
      })
    })
  })

  // Example 5: Track video engagement
  const video = document.getElementById('demo-video')
  video.addEventListener('play', () => {
    conteo.trackEvent('Video Play', {
      props: { video: 'product-demo' }
    })
  })

  // Example 6: Track ecommerce actions
  function addToCart(productId, productName) {
    conteo.trackEvent('Add to Cart', {
      props: {
        product_id: productId,
        product_name: productName
      }
    })
  }
</script>`}
                      </pre>
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <h4 className="text-xs font-semibold text-blue-900 mb-2">💡 Pro Tips:</h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Use clear, consistent event names ("Button Click" not "btn_clk")</li>
                        <li>• Add properties to segment your data (which button, which form, etc.)</li>
                        <li>• Properties appear as separate columns in your exports</li>
                        <li>• Events are tracked along with source, device, and location automatically</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Collapsible Documentation Guide */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setShowEventsGuide(!showEventsGuide)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition text-left"
                    >
                      <span className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="mr-2">📚</span>
                        How to track custom events
                      </span>
                      <span className="text-gray-500">
                        {showEventsGuide ? '▼' : '▶'}
                      </span>
                    </button>

                    {showEventsGuide && (
                      <div className="p-4 bg-white border-t border-gray-200 space-y-6">
                        {/* What are Custom Events */}
                        <div>
                          <h4 className="text-base font-bold text-gray-900 mb-2">What are Custom Events?</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Custom events let you track specific user actions beyond pageviews.
                            Instead of just knowing <em>which pages</em> users visit, you can track <em>what they do</em> on those pages.
                          </p>
                        </div>

                        {/* Use Cases */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Common use cases:</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>• Button clicks ("CTA Click", "Buy Now")</div>
                            <div>• Form submissions ("Contact Form", "Newsletter")</div>
                            <div>• Downloads ("PDF Download", "eBook")</div>
                            <div>• Video plays ("Tutorial Video")</div>
                            <div>• Feature usage ("Filter Applied", "Search")</div>
                            <div>• Signups ("Account Created")</div>
                          </div>
                        </div>

                        {/* Basic Syntax */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 Basic syntax:</h4>
                          <div className="bg-white border border-gray-200 rounded p-3 text-xs font-mono text-gray-700">
                            conteo.trackEvent(<span className="text-green-600">'Event Name'</span>, &#123; props: &#123; key: value &#125; &#125;)
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            <strong>Event Name:</strong> Describe what happened (e.g., "Button Click")
                            <br />
                            <strong>Properties (optional):</strong> Add context like which button, file name, etc.
                          </p>
                        </div>

                        {/* Examples */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 Real examples:</h4>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto leading-relaxed">
{`<!-- Example 1: Track button clicks inline -->
<button onclick="conteo.trackEvent('CTA Click')">
  Get Started
</button>

<!-- Example 2: Track with context (which button was clicked) -->
<button onclick="conteo.trackEvent('CTA Click', {
  props: { location: 'hero', label: 'Get Started' }
})">
  Get Started
</button>

<script>
  // Example 3: Track form submissions
  document.getElementById('contact-form').addEventListener('submit', (e) => {
    conteo.trackEvent('Form Submit', {
      props: { form: 'contact' }
    })
  })

  // Example 4: Track file downloads
  document.querySelectorAll('a[download]').forEach(link => {
    link.addEventListener('click', () => {
      conteo.trackEvent('Download', {
        props: {
          file: link.getAttribute('download'),
          format: link.href.split('.').pop()
        }
      })
    })
  })

  // Example 5: Track video engagement
  const video = document.getElementById('demo-video')
  video.addEventListener('play', () => {
    conteo.trackEvent('Video Play', {
      props: { video: 'product-demo' }
    })
  })

  // Example 6: Track ecommerce actions
  function addToCart(productId, productName) {
    conteo.trackEvent('Add to Cart', {
      props: {
        product_id: productId,
        product_name: productName
      }
    })
  }
</script>`}
                          </pre>
                        </div>

                        {/* Tips */}
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <h4 className="text-xs font-semibold text-blue-900 mb-2">💡 Pro Tips:</h4>
                          <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Use clear, consistent event names ("Button Click" not "btn_clk")</li>
                            <li>• Add properties to segment your data (which button, which form, etc.)</li>
                            <li>• Properties appear as separate columns in your exports</li>
                            <li>• Events are tracked along with source, device, and location automatically</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Events Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            <div className="inline-flex items-center">
                              Event Name
                              <span className="ml-2 text-[10px] text-gray-400 normal-case">(click to expand)</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Total Events
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Unique Visitors
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            <div className="inline-flex items-center justify-end">
                              Conversion Rate
                              <InfoTooltip text="Percentage of unique visitors who triggered this event. Shows how engaging this action is." />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {customEvents.map((event, i) => {
                          const isExpanded = expandedEvent === event.event_name
                          const details = eventDetails[event.event_name]
                          const totalEvents = Number(event.total_events)

                          return (
                            <Fragment key={`evt-${i}`}>
                              <tr
                                onClick={() => toggleEventDetails(event.event_name)}
                                className="hover:bg-gray-50 cursor-pointer transition"
                              >
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  <div className="flex items-center">
                                    <span className="mr-2 text-gray-400">
                                      {isExpanded ? '▼' : '▶'}
                                    </span>
                                    {event.event_name}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">
                                  {totalEvents.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">
                                  {Number(event.unique_visitors).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-right">
                                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
                                    {Number(event.conversion_rate).toFixed(1)}%
                                  </span>
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr>
                                  <td colSpan={4} className="px-4 py-4 bg-gray-50">
                                    {loadingEventDetails ? (
                                      <div className="text-center py-4 text-sm text-gray-500">Loading details...</div>
                                    ) : details ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                                          <h4 className="text-xs font-semibold text-gray-700 mb-3">
                                            Top Sources
                                          </h4>
                                          {details.sources.length === 0 ? (
                                            <p className="text-xs text-gray-500">No source data</p>
                                          ) : (
                                            <div className="space-y-2">
                                              {details.sources.slice(0, 5).map((source, idx) => {
                                                const percentage = Math.min(((Number(source.event_count) / totalEvents) * 100), 100)
                                                return (
                                                  <div key={idx} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                      <span className="font-medium text-gray-700">{source.source}</span>
                                                      <span className="text-gray-500">{Number(source.event_count).toLocaleString()} ({percentage.toFixed(0)}%)</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                      <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                                                    </div>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </div>

                                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                                          <h4 className="text-xs font-semibold text-gray-700 mb-3">
                                            Top Pages
                                          </h4>
                                          {details.pages.length === 0 ? (
                                            <p className="text-xs text-gray-500">No page data</p>
                                          ) : (
                                            <div className="space-y-2">
                                              {details.pages.slice(0, 5).map((page, idx) => {
                                                const percentage = Math.min(((Number(page.event_count) / totalEvents) * 100), 100)
                                                return (
                                                  <div key={idx} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                      <span className="font-medium text-gray-700 truncate">{page.path || '/'}</span>
                                                      <span className="text-gray-500 ml-2 flex-shrink-0">{Number(page.event_count).toLocaleString()} ({percentage.toFixed(0)}%)</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                      <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                                                    </div>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </div>

                                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                                          <h4 className="text-xs font-semibold text-gray-700 mb-3">
                                            Devices
                                          </h4>
                                          {details.devices.length === 0 ? (
                                            <p className="text-xs text-gray-500">No device data</p>
                                          ) : (
                                            <div className="space-y-2">
                                              {details.devices.map((device, idx) => {
                                                const percentage = Math.min(((Number(device.event_count) / totalEvents) * 100), 100)
                                                return (
                                                  <div key={idx} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                      <span className="font-medium text-gray-700">{device.device}</span>
                                                      <span className="text-gray-500">{Number(device.event_count).toLocaleString()} ({percentage.toFixed(0)}%)</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                      <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                                                    </div>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </div>

                                        {details.properties.length > 0 && (
                                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                                            <h4 className="text-xs font-semibold text-gray-700 mb-3">
                                              Properties
                                            </h4>
                                            <div className="space-y-2">
                                              {details.properties.slice(0, 5).map((prop, idx) => {
                                                const percentage = Math.min(((Number(prop.event_count) / totalEvents) * 100), 100)
                                                return (
                                                  <div key={idx} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                      <span className="font-medium text-gray-700">{prop.property_key}: {prop.property_value}</span>
                                                      <span className="text-gray-500 ml-2 flex-shrink-0">{Number(prop.event_count).toLocaleString()} ({percentage.toFixed(0)}%)</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                      <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                                                    </div>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : null}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Campaigns */}
        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                UTM Campaigns
              </h3>
            </div>
            <div className="p-4">
              {campaigns.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No campaigns tracked yet. Use UTM parameters in your URLs to track campaigns.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medium</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pageviews</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unique</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {campaigns.map((campaign, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">{campaign.utm_campaign || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{campaign.utm_source || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{campaign.utm_medium || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{campaign.utm_content || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{campaign.utm_term || '-'}</td>
                            <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900">{Number(campaign.pageviews).toLocaleString()}</td>
                            <td className="px-3 py-2 text-sm text-right text-gray-600">{Number(campaign.unique_visitors).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {hasMoreCampaigns && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={loadMoreCampaigns}
                        disabled={loadingMoreCampaigns}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                      >
                        {loadingMoreCampaigns ? 'Loading...' : 'Load More Campaigns'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Recent Activity */}
        {activeTab === 'activity' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              Recent Activity
            </h3>
            <span className="text-xs text-gray-500">Last 15 visits</span>
          </div>
          <div className="p-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No recent activity yet.
              </p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity, i) => {
                  // Format timestamp as relative time
                  const activityTime = new Date(activity.visit_time)
                  const now = new Date()
                  const diffMs = now.getTime() - activityTime.getTime()
                  const diffMins = Math.floor(diffMs / 60000)
                  const diffHours = Math.floor(diffMs / 3600000)

                  let timeAgo = ''
                  if (diffMins < 1) timeAgo = 'Just now'
                  else if (diffMins < 60) timeAgo = `${diffMins}m ago`
                  else if (diffHours < 24) timeAgo = `${diffHours}h ago`
                  else timeAgo = activityTime.toLocaleDateString()

                  // Device icon
                  const deviceIcon = activity.device === 'Mobile' ? '📱' : activity.device === 'Desktop' ? '💻' : '❓'

                  // Browser icon
                  let browserIcon = '🌐'
                  const browserLower = activity.browser.toLowerCase()
                  if (browserLower.includes('chrome')) browserIcon = '🟢'
                  else if (browserLower.includes('safari')) browserIcon = '🔵'
                  else if (browserLower.includes('firefox')) browserIcon = '🟠'
                  else if (browserLower.includes('edge')) browserIcon = '🔷'

                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Path */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{activity.path}</p>
                        </div>

                        {/* Country Flag */}
                        <div className="flex-shrink-0">
                          <span className="text-lg">{getCountryFlag(activity.country)}</span>
                        </div>

                        {/* Device */}
                        <div className="flex-shrink-0">
                          <span className="text-base">{deviceIcon}</span>
                        </div>

                        {/* Browser */}
                        <div className="flex-shrink-0">
                          <span className="text-base">{browserIcon}</span>
                        </div>

                        {/* Time ago */}
                        <div className="flex-shrink-0">
                          <span className="text-xs text-gray-500 font-medium">{timeAgo}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Installation Instructions - Always visible */}
        <div className="mt-6 md:mt-8 bg-indigo-50 border border-indigo-200 rounded-lg p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-indigo-900 mb-2">
            🚀 Add tracking to {selectedSite?.domain}
          </h3>
          <p className="text-xs md:text-sm text-indigo-700 mb-3 md:mb-4">
            Copy this snippet to your website's <code className="bg-indigo-100 px-1 md:px-2 py-1 rounded text-xs">&lt;head&gt;</code> tag:
          </p>
          <pre className="bg-indigo-900 text-indigo-100 p-3 md:p-4 rounded-lg overflow-x-auto text-xs md:text-sm">
{`<script
  src="${trackerUrl || 'https://your-app.vercel.app/tracker.js'}"
  data-api-key="${selectedSite?.api_key}"
  defer
></script>`}
          </pre>
          <p className="text-xs text-indigo-600 mt-2 md:mt-3">
            ✅ Works with SPAs • 📦 Less than 1KB • ⚡ Zero impact
          </p>
        </div>

      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
