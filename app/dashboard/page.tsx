'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    liveUsers: 0,
    todayViews: 0,
    weekViews: 0,
    monthViews: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      // For MVP: hardcoded demo data
      // In production, fetch from Supabase using the helper functions

      setStats({
        liveUsers: 3,
        todayViews: 142,
        weekViews: 1247,
        monthViews: 5892,
      })

      setLoading(false)
    } catch (error) {
      console.error('Error loading stats:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
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
              <span className="text-sm text-gray-600">yoursite.com</span>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

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
          <h3 className="text-lg font-semibold text-indigo-900 mb-2">🚀 Add to your website</h3>
          <p className="text-sm text-indigo-700 mb-4">
            Copy this snippet to your website's <code className="bg-indigo-100 px-2 py-1 rounded">&lt;head&gt;</code> tag:
          </p>
          <pre className="bg-indigo-900 text-indigo-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<script
  src="https://conteo.online/tracker.js"
  data-api-key="YOUR_API_KEY"
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
