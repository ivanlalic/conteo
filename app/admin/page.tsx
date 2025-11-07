'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserProfile {
  user_id: string
  email: string
  plan: string
  is_admin: boolean
  site_count: number
  total_pageviews: number
  created_at: string
}

interface Site {
  id: string
  domain: string
  user_id: string
  user_email: string
  cod_tracking_enabled: boolean
  pageviews_count: number
  created_at: string
}

interface SystemStats {
  total_users: number
  total_sites: number
  total_pageviews: number
  total_cod_conversions: number
  free_users: number
  pro_users: number
  enterprise_users: number
}

interface AuditLog {
  id: string
  action: string
  target_type: string
  target_id: string
  details: any
  created_at: string
  admin_email: string
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'sites' | 'stats' | 'logs'>('stats')

  // Data states
  const [users, setUsers] = useState<UserProfile[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      if (authLoading) return

      if (!user) {
        router.push('/login')
        return
      }

      try {
        const { data, error } = await supabase.rpc('is_admin')

        if (error) {
          console.error('Error checking admin status:', error)
          router.push('/dashboard')
          return
        }

        if (!data) {
          router.push('/dashboard')
          return
        }

        setIsAdmin(true)
        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/dashboard')
      }
    }

    checkAdmin()
  }, [user, authLoading, router])

  // Load data based on active tab
  useEffect(() => {
    if (!isAdmin) return

    if (activeTab === 'users') {
      loadUsers()
    } else if (activeTab === 'sites') {
      loadSites()
    } else if (activeTab === 'stats') {
      loadStats()
    } else if (activeTab === 'logs') {
      loadAuditLogs()
    }
  }, [activeTab, isAdmin])

  async function loadUsers() {
    try {
      const { data, error } = await supabase.rpc('get_all_users_admin')
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  async function loadSites() {
    try {
      // Get all sites with user info
      const { data, error } = await supabase
        .from('sites')
        .select(`
          id,
          domain,
          user_id,
          cod_tracking_enabled,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get user emails
      const userIds = [...new Set(data?.map(s => s.user_id) || [])]
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, email')
        .in('id', userIds)

      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || [])

      // Get pageview counts for each site
      const sitesWithData: Site[] = await Promise.all(
        (data || []).map(async (site) => {
          const { count } = await supabase
            .from('pageviews')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', site.id)

          return {
            ...site,
            user_email: emailMap.get(site.user_id) || 'Unknown',
            pageviews_count: count || 0
          }
        })
      )

      setSites(sitesWithData)
    } catch (error) {
      console.error('Error loading sites:', error)
    }
  }

  async function loadStats() {
    try {
      const { data, error } = await supabase.rpc('get_system_stats')
      if (error) throw error
      if (data && data.length > 0) {
        setStats(data[0])
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  async function loadAuditLogs() {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          target_type,
          target_id,
          details,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Get admin emails
      const adminIds = [...new Set(data?.map(l => l.details?.admin_id) || [])]
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, email')
        .in('id', adminIds)

      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || [])

      const logsWithEmails = (data || []).map(log => ({
        ...log,
        admin_email: emailMap.get(log.details?.admin_id) || 'System'
      }))

      setAuditLogs(logsWithEmails)
    } catch (error) {
      console.error('Error loading audit logs:', error)
    }
  }

  async function updateUserPlan(userId: string, newPlan: string) {
    if (!confirm(`Change user plan to ${newPlan}?`)) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ plan: newPlan })
        .eq('id', userId)

      if (error) throw error

      // Log action
      await supabase.from('audit_logs').insert({
        admin_id: user!.id,
        action: 'update_plan',
        target_type: 'user',
        target_id: userId,
        details: { new_plan: newPlan, admin_id: user!.id }
      })

      alert('Plan updated successfully')
      loadUsers()
    } catch (error) {
      console.error('Error updating plan:', error)
      alert('Error updating plan')
    }
  }

  async function deleteUser(userId: string, userEmail: string) {
    if (!confirm(`Delete user ${userEmail}? This will delete all their sites and data. This cannot be undone!`)) return

    try {
      // Note: Cascade deletes will handle sites and pageviews
      const { error } = await supabase.auth.admin.deleteUser(userId)

      if (error) throw error

      // Log action
      await supabase.from('audit_logs').insert({
        admin_id: user!.id,
        action: 'delete_user',
        target_type: 'user',
        target_id: userId,
        details: { email: userEmail, admin_id: user!.id }
      })

      alert('User deleted successfully')
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user. You may need special permissions.')
    }
  }

  async function deleteSite(siteId: string, domain: string) {
    if (!confirm(`Delete site ${domain}? This will delete all pageview data. This cannot be undone!`)) return

    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', siteId)

      if (error) throw error

      // Log action
      await supabase.from('audit_logs').insert({
        admin_id: user!.id,
        action: 'delete_site',
        target_type: 'site',
        target_id: siteId,
        details: { domain, admin_id: user!.id }
      })

      alert('Site deleted successfully')
      loadSites()
    } catch (error) {
      console.error('Error deleting site:', error)
      alert('Error deleting site')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">🔐 Admin Panel</h1>
              <span className="text-sm text-gray-500">conteo.online</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </Link>
              <span className="text-sm text-gray-500">{user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Statistics
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Users
            </button>
            <button
              onClick={() => setActiveTab('sites')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sites'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🌐 Sites
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📝 Audit Logs
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics Tab */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Total Users</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total_users}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Total Sites</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total_sites}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Total Pageviews</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total_pageviews.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">COD Conversions</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total_cod_conversions}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Free</span>
                  <span className="text-sm font-medium text-gray-900">{stats.free_users} users</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pro</span>
                  <span className="text-sm font-medium text-gray-900">{stats.pro_users} users</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Enterprise</span>
                  <span className="text-sm font-medium text-gray-900">{stats.enterprise_users} users</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sites
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pageviews
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {user.email}
                          {user.is_admin && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.plan}
                        onChange={(e) => updateUserPlan(user.user_id, e.target.value)}
                        className="text-sm border-gray-300 rounded-md"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.site_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.total_pageviews.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!user.is_admin && (
                        <button
                          onClick={() => deleteUser(user.user_id, user.email)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sites Tab */}
        {activeTab === 'sites' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pageviews
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    COD Tracking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sites.map((site) => (
                  <tr key={site.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {site.domain}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {site.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {site.pageviews_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {site.cod_tracking_enabled ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Enabled
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(site.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteSite(site.id, site.domain)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.admin_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.target_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
