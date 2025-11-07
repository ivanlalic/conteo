'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

interface Site {
  id: string
  domain: string
  api_key: string
  cod_tracking_enabled: boolean
  created_at: string
}

function SitesContent() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomain, setNewDomain] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [trackerUrl, setTrackerUrl] = useState('')

  useEffect(() => {
    loadSites()
    // Get the current app URL for the tracking snippet
    if (typeof window !== 'undefined') {
      setTrackerUrl(`${window.location.origin}/tracker.js`)
    }
  }, [])

  async function loadSites() {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, domain, api_key, cod_tracking_enabled, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSites(data || [])
    } catch (err: any) {
      console.error('Error loading sites:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createSite(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('sites')
        .insert({
          domain: newDomain,
          user_id: user!.id,
        })
        .select()
        .single()

      if (error) throw error

      // Add to list
      setSites([data, ...sites])
      setNewDomain('')
    } catch (err: any) {
      console.error('Error creating site:', err)
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function deleteSite(siteId: string) {
    if (!confirm('Are you sure you want to delete this site? All analytics data will be lost.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', siteId)

      if (error) throw error

      setSites(sites.filter(s => s.id !== siteId))
    } catch (err: any) {
      console.error('Error deleting site:', err)
      setError(err.message)
    }
  }

  async function toggleCODTracking(siteId: string, currentValue: boolean) {
    try {
      const { error } = await supabase
        .from('sites')
        .update({ cod_tracking_enabled: !currentValue })
        .eq('id', siteId)

      if (error) throw error

      // Update local state
      setSites(sites.map(s =>
        s.id === siteId
          ? { ...s, cod_tracking_enabled: !currentValue }
          : s
      ))
    } catch (err: any) {
      console.error('Error toggling COD tracking:', err)
      setError(err.message)
    }
  }

  function copyApiKey(apiKey: string) {
    navigator.clipboard.writeText(apiKey)
    setCopiedKey(apiKey)
    setTimeout(() => setCopiedKey(null), 2000)
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
              <Link
                href="/dashboard"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Dashboard
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Sites</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Add New Site Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Site</h3>
          <form onSubmit={createSite} className="flex gap-4">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {creating ? 'Adding...' : 'Add Site'}
            </button>
          </form>
        </div>

        {/* Sites List */}
        {sites.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No sites yet. Add your first site to get started!</p>
            <p className="text-sm text-gray-500">
              After adding a site, you'll get an API key to track analytics.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sites.map((site) => (
              <div key={site.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{site.domain}</h3>
                    <p className="text-sm text-gray-500">
                      Created {new Date(site.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard?site=${site.id}`}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                    >
                      View Analytics
                    </Link>
                    <button
                      onClick={() => deleteSite(site.id)}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">API Key:</label>
                    <button
                      onClick={() => copyApiKey(site.api_key)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                      {copiedKey === site.api_key ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                  <code className="block text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200 overflow-x-auto">
                    {site.api_key}
                  </code>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Installation:</p>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`<script
  src="${trackerUrl || 'https://your-app.vercel.app/tracker.js'}"
  data-api-key="${site.api_key}"
  defer
></script>`}
                    </pre>
                    <p className="text-xs text-gray-500 mt-2">
                      Add this snippet to your website's <code className="bg-gray-200 px-1 rounded">&lt;head&gt;</code> tag
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">COD Conversion Tracking</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Track Cash on Delivery conversions from Facebook & TikTok pixels
                        </p>
                      </div>
                      <button
                        onClick={() => toggleCODTracking(site.id, site.cod_tracking_enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          site.cod_tracking_enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            site.cod_tracking_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function Sites() {
  return (
    <ProtectedRoute>
      <SitesContent />
    </ProtectedRoute>
  )
}
