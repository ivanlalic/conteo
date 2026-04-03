'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AddGoalModal from './AddGoalModal'

interface Goal {
  id: string
  goal_type: 'pageview' | 'custom_event'
  display_name: string
  page_path: string | null
  match_type: string | null
  event_name: string | null
  created_at: string
}

export default function GoalsSettings({ siteId }: { siteId: string }) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchGoals()
  }, [siteId])

  async function fetchGoals() {
    setLoading(true)
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    const res = await fetch(`/api/goals?site_id=${siteId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (res.ok) setGoals(await res.json())
    setLoading(false)
  }

  async function deleteGoal(goalId: string) {
    if (!confirm('Delete this goal? Historical data will still be available.')) return

    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    const res = await fetch(`/api/goals?id=${goalId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (res.ok) setGoals(goals.filter(g => g.id !== goalId))
  }

  if (loading) {
    return <div className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Goals</h3>
          <p className="text-xs text-gray-500 mt-1">
            Track conversions from page visits or custom events ({goals.length}/20)
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={goals.length >= 20}
          className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          Add goal
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          No goals configured yet
        </p>
      ) : (
        <div className="space-y-2">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  goal.goal_type === 'pageview'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                }`}>
                  {goal.goal_type === 'pageview' ? 'Pageview' : 'Event'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {goal.display_name}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {goal.goal_type === 'pageview'
                      ? `${goal.match_type}: ${goal.page_path}`
                      : goal.event_name
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteGoal(goal.id)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddGoalModal
          siteId={siteId}
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); fetchGoals() }}
        />
      )}
    </div>
  )
}
