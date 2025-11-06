'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

interface Site {
  id: string
  domain: string
  api_key: string
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
  })

  useEffect(() => {
    loadSites()
  }, [])

  useEffect(() => {
    if (selectedSite) {
      loadStats()
    }
  }, [selectedSite])

  async function loadSites() {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, domain, api_key')
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
      // For MVP: hardcoded demo data per site
      // TODO: Replace with real Supabase queries using selectedSite.id

      setStats({
        liveUsers: Math.floor(Math.random() * 10) + 1,
        todayViews: Math.floor(Math.random() * 500) + 50,
        weekViews: Math.floor(Math.random() * 3000) + 500,
        monthViews: Math.floor(Math.random() * 10000) + 1000,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-xl p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Conteo!</h2>
            <p className="text-gray-600 mb-8">
              You don't have any sites yet. Let's add your first one to start tracking analytics.
            </p>
            <Link
              href="/sites"
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">conteo.online</h1>
            <div className="flex items-center space-x-4">
              <Link
                href="/sites"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                My Sites
              </Link>
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

      {/* Site Selector Bar */}
      <div className="bg-indigo-600 border-b border-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-indigo-100 text-sm font-medium">Viewing analytics for:</span>
              <select
                value={selectedSite?.id || ''}
                onChange={(e) => {
                  const site = sites.find(s => s.id === e.target.value)
                  setSelectedSite(site || null)
                }}
                className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.domain}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-indigo-100 text-sm">
              {sites.length} {sites.length === 1 ? 'site' : 'sites'} total
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Live Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Live Users</h3>
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.liveUsers}</p>
            <p className="text-xs text-gray-500 mt-1">Last 5 minutes</p>
          </div>

          {/* Today */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Today</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.todayViews.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Pageviews</p>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">This Week</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.weekViews.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Pageviews</p>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">This Month</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.monthViews.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Pageviews</p>
          </div>
        </div>

        {/* Charts & Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top Pages */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Pages</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { path: '/', views: 523, visitors: 412 },
                  { path: '/pricing', views: 284, visitors: 201 },
                  { path: '/features', views: 176, visitors: 143 },
                  { path: '/blog', views: 98, visitors: 87 },
                  { path: '/about', views: 67, visitors: 54 },
                ].map((page, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{page.path}</p>
                      <p className="text-xs text-gray-500">{page.visitors} unique visitors</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{page.views}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Referrers */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Referrers</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { source: 'google.com', visits: 432 },
                  { source: 'Direct / None', visits: 287 },
                  { source: 'twitter.com', visits: 143 },
                  { source: 'github.com', visits: 98 },
                  { source: 'hackernews.com', visits: 54 },
                ].map((ref, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-900">{ref.source}</p>
                    <p className="text-sm font-semibold text-gray-900">{ref.visits}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="bg-white rounded-lg shadow lg:col-span-2">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Last 7 Days</h3>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center text-gray-400">
                Chart.js integration - Coming next
              </div>
            </div>
          </div>

        </div>

        {/* Installation Instructions */}
        <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-2">
            🚀 Add tracking to {selectedSite?.domain}
          </h3>
          <p className="text-sm text-indigo-700 mb-4">
            Copy this snippet to your website's <code className="bg-indigo-100 px-2 py-1 rounded">&lt;head&gt;</code> tag:
          </p>
          <pre className="bg-indigo-900 text-indigo-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<script
  src="https://conteo.online/tracker.js"
  data-api-key="${selectedSite?.api_key}"
  defer
></script>`}
          </pre>
          <p className="text-xs text-indigo-600 mt-3">
            ✅ Works with Next.js, React, Vue, and all SPAs • 📦 Less than 1KB • ⚡ Zero impact on performance
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
