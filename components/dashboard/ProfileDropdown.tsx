'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface ProfileDropdownProps {
  email: string
  planUsage: {
    current: number
    limit: number
    tier: string
    sitesUsed: number
    sitesLimit: number
  } | null
  onSignOut: () => void
}

export default function ProfileDropdown({ email, planUsage, onSignOut }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on ESC
  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  function getUsagePercent(current: number, limit: number): number {
    if (limit === 0) return 0
    return Math.min((current / limit) * 100, 100)
  }

  function getUsageColor(percent: number): string {
    if (percent >= 100) return 'bg-red-500'
    if (percent >= 70) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const isAdmin = email === 'ivanlalic@gmail.com'
  const eventsPercent = planUsage ? getUsagePercent(planUsage.current, planUsage.limit) : 0
  const sitesPercent = planUsage ? getUsagePercent(planUsage.sitesUsed, planUsage.sitesLimit) : 0

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-secondary hover:bg-bg-hover border border-border transition-colors"
        title="Account"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-text-secondary">
          <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* User info */}
          <div className="p-4 border-b border-border">
            <p className="text-sm font-medium text-text-primary truncate">{email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isAdmin 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : planUsage?.tier === 'pro'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                {isAdmin ? 'Admin' : planUsage?.tier === 'pro' ? 'Pro' : 'Free'}
              </span>
              {isAdmin && (
                <span className="text-xs text-text-tertiary">Unlimited</span>
              )}
            </div>
          </div>

          {/* Usage (not for admin) */}
          {!isAdmin && planUsage && (
            <div className="p-4 space-y-3 border-b border-border">
              {/* Events usage */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-secondary">Events this month</span>
                  <span className="text-text-primary font-medium">
                    {planUsage.current.toLocaleString()} / {planUsage.limit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getUsageColor(eventsPercent)}`}
                    style={{ width: `${eventsPercent}%` }}
                  />
                </div>
              </div>

              {/* Sites usage */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-secondary">Sites</span>
                  <span className="text-text-primary font-medium">
                    {planUsage.sitesUsed} / {planUsage.sitesLimit}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getUsageColor(sitesPercent)}`}
                    style={{ width: `${sitesPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upgrade button (not for admin or pro) */}
          {!isAdmin && planUsage?.tier === 'free' && (
            <div className="p-3 border-b border-border">
              <Link
                href="/pricing"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-medium bg-primary text-white rounded-md hover:opacity-90 transition"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.251.068a.5.5 0 01.227.58L9.677 6.5H13a.5.5 0 01.364.843l-8 8.5a.5.5 0 01-.842-.49L6.323 9.5H3a.5.5 0 01-.364-.843l8-8.5a.5.5 0 01.615-.09z" />
                </svg>
                Upgrade to Pro
              </Link>
            </div>
          )}

          {/* Links */}
          <div className="p-2">
            <Link
              href="/sites"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-md transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 4.754a3.246 3.246 0 100 6.492 3.246 3.246 0 000-6.492zM5.754 8a2.246 2.246 0 114.492 0 2.246 2.246 0 01-4.492 0z" />
                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 01-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 01-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 01.52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 011.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 011.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 01.52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 01-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 01-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 002.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 001.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 00-1.115 2.693l.16.291c.415.764-.421 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 00-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 00-2.692-1.115l-.292.16c-.764.415-1.6-.421-1.184-1.185l.159-.291A1.873 1.873 0 001.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 003.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 002.692-1.116l.094-.318z" />
              </svg>
              My Sites
            </Link>
            <button
              onClick={() => {
                setIsOpen(false)
                onSignOut()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-md transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M10 12.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 009.5 2h-8A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h8a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z" />
                <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 000-.708l-3-3a.5.5 0 00-.708.708L14.293 7.5H5.5a.5.5 0 000 1h8.793l-2.147 2.146a.5.5 0 00.708.708l3-3z" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
