'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AddGoalModal from './AddGoalModal'

interface GoalConversion {
  goal_id: string
  goal_type: 'pageview' | 'custom_event'
  display_name: string
  page_path: string | null
  match_type: string | null
  event_name: string | null
  total_conversions: number
  unique_visitors: number
  conversion_rate: number
}

interface GoalsPanelProps {
  siteId: string
  startDate: string
  endDate: string
}

export default function GoalsPanel({ siteId, startDate, endDate }: GoalsPanelProps) {
  const [goals, setGoals] = useState<GoalConversion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchGoals()
  }, [siteId, startDate, endDate])

  async function fetchGoals() {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_goals_with_conversions', {
      p_site_id: siteId,
      p_start_date: startDate,
      p_end_date: endDate,
    })
    if (!error && data) {
      setGoals(data)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="animate-pulse h-32 bg-bg-secondary rounded-lg" />
  }

  // Empty state
  if (goals.length === 0) {
    return (
      <div className="border border-border rounded-lg bg-bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Goals</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-text-tertiary mb-4">
            Track conversions without writing code
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-sm px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Add your first goal
          </button>
        </div>
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

  return (
    <div className="border border-border rounded-lg bg-bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Goals</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-xs text-primary hover:opacity-80 transition-opacity"
        >
          + Add goal
        </button>
      </div>

      <div className="space-y-0">
        {goals.map((goal) => (
          <div
            key={goal.goal_id}
            className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs w-5 h-5 flex items-center justify-center rounded bg-bg-secondary text-text-tertiary flex-shrink-0 font-medium">
                {goal.goal_type === 'pageview' ? 'P' : 'E'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {goal.display_name}
                </p>
                <p className="text-xs text-text-tertiary truncate">
                  {goal.goal_type === 'pageview' ? goal.page_path : goal.event_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
              <div className="text-right">
                <p className="text-sm font-medium text-text-primary tabular-nums">
                  {goal.unique_visitors.toLocaleString()}
                </p>
                <p className="text-xs text-text-tertiary">visitors</p>
              </div>
              <div className="text-right min-w-[52px]">
                <p className={`text-sm font-medium tabular-nums ${
                  goal.conversion_rate > 5 ? 'text-positive' :
                  goal.conversion_rate > 1 ? 'text-warning' :
                  'text-text-tertiary'
                }`}>
                  {goal.conversion_rate}%
                </p>
                <p className="text-xs text-text-tertiary">CR</p>
              </div>
            </div>
          </div>
        ))}
      </div>

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
