'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AddGoalModalProps {
  siteId: string
  onClose: () => void
  onCreated: () => void
}

export default function AddGoalModal({ siteId, onClose, onCreated }: AddGoalModalProps) {
  const [goalType, setGoalType] = useState<'pageview' | 'custom_event'>('pageview')
  const [pagePath, setPagePath] = useState('')
  const [matchType, setMatchType] = useState<'exact' | 'contains' | 'starts_with'>('exact')
  const [eventName, setEventName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')

    if (!displayName.trim()) {
      setError('Enter a display name')
      return
    }
    if (goalType === 'pageview' && !pagePath.trim()) {
      setError('Enter a page path')
      return
    }
    if (goalType === 'custom_event' && !eventName.trim()) {
      setError('Enter an event name')
      return
    }

    setSaving(true)

    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        site_id: siteId,
        goal_type: goalType,
        display_name: displayName.trim(),
        page_path: goalType === 'pageview' ? pagePath.trim() : null,
        match_type: goalType === 'pageview' ? matchType : null,
        event_name: goalType === 'custom_event' ? eventName.trim() : null,
      }),
    })

    if (res.ok) {
      onCreated()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create goal')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-bg-card rounded-xl shadow-lg w-full max-w-md mx-4 p-6 border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Add a goal
        </h2>

        {/* Type selector */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setGoalType('pageview')}
            className={`p-3 rounded-lg border text-left transition-colors ${
              goalType === 'pageview'
                ? 'border-primary bg-primary-light'
                : 'border-border hover:border-text-tertiary'
            }`}
          >
            <p className="text-sm font-medium text-text-primary">Pageview</p>
            <p className="text-xs text-text-tertiary mt-1">Track page visits, no code needed</p>
          </button>
          <button
            onClick={() => setGoalType('custom_event')}
            className={`p-3 rounded-lg border text-left transition-colors ${
              goalType === 'custom_event'
                ? 'border-primary bg-primary-light'
                : 'border-border hover:border-text-tertiary'
            }`}
          >
            <p className="text-sm font-medium text-text-primary">Custom event</p>
            <p className="text-xs text-text-tertiary mt-1">Track conteo.track() calls</p>
          </button>
        </div>

        {/* Display name */}
        <label className="block mb-4">
          <span className="text-xs font-medium text-text-secondary">Display name</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Purchase completed"
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-card text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </label>

        {/* Pageview fields */}
        {goalType === 'pageview' && (
          <>
            <label className="block mb-3">
              <span className="text-xs font-medium text-text-secondary">Page path</span>
              <input
                type="text"
                value={pagePath}
                onChange={(e) => setPagePath(e.target.value)}
                placeholder="/thank-you"
                className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-card text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono"
              />
            </label>
            <div className="mb-4">
              <span className="text-xs font-medium text-text-secondary">Match type</span>
              <div className="flex gap-4 mt-2">
                {[
                  { value: 'exact', label: 'Exact', hint: '/thank-you' },
                  { value: 'contains', label: 'Contains', hint: 'thank' },
                  { value: 'starts_with', label: 'Starts with', hint: '/blog/' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="match_type"
                      value={opt.value}
                      checked={matchType === opt.value}
                      onChange={() => setMatchType(opt.value as typeof matchType)}
                      className="accent-primary"
                    />
                    <span className="text-xs text-text-secondary">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Custom event fields */}
        {goalType === 'custom_event' && (
          <label className="block mb-4">
            <span className="text-xs font-medium text-text-secondary">Event name</span>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="signup_click"
              className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-card text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono"
            />
            <p className="text-xs text-text-tertiary mt-1">
              Must match the name in conteo.track('{eventName || 'event_name'}')
            </p>
          </label>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-negative mb-3">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="text-sm px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Adding...' : 'Add goal'}
          </button>
        </div>
      </div>
    </div>
  )
}
