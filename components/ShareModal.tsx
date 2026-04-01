'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  siteId: string
  siteDomain: string
}

interface ShareData {
  token: string
  isPublic: boolean
}

export default function ShareModal({ isOpen, onClose, siteId, siteDomain }: ShareModalProps) {
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [copied, setCopied] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  useEffect(() => {
    if (isOpen && siteId) {
      loadShareData()
    }
  }, [isOpen, siteId])

  async function loadShareData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('site_shares')
        .select('share_token, is_public')
        .eq('site_id', siteId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading share data:', error)
        return
      }

      if (data) {
        setShareData({ token: data.share_token, isPublic: data.is_public })
      } else {
        setShareData(null)
      }
    } catch (error) {
      console.error('Error loading share data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleShare(enabled: boolean) {
    if (!siteId) return

    setToggling(true)
    try {
      if (enabled) {
        // Create or update share
        if (shareData?.token) {
          // Update existing
          const { error } = await supabase
            .from('site_shares')
            .update({ is_public: true })
            .eq('site_id', siteId)

          if (error) throw error
          setShareData({ ...shareData, isPublic: true })
        } else {
          // Create new
          const { data, error } = await supabase
            .from('site_shares')
            .insert({
              site_id: siteId,
              share_token: crypto.randomUUID(),
              is_public: true,
            })
            .select('share_token, is_public')
            .single()

          if (error) throw error
          setShareData({ token: data.share_token, isPublic: data.is_public })
        }
      } else {
        // Disable sharing
        if (shareData?.token) {
          const { error } = await supabase
            .from('site_shares')
            .update({ is_public: false })
            .eq('site_id', siteId)

          if (error) throw error
          setShareData({ ...shareData, isPublic: false })
        }
      }
    } catch (error) {
      console.error('Error toggling share:', error)
    } finally {
      setToggling(false)
    }
  }

  function copyShareLink() {
    if (!shareData?.token) return

    const link = `${baseUrl}/share/${shareData.token}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!isOpen) return null

  const shareLink = shareData?.token ? `${baseUrl}/share/${shareData.token}` : ''
  const isPublic = shareData?.isPublic || false

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Share Public Dashboard
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary mb-6">
          Allow anyone with the link to view analytics for <span className="font-medium text-text-primary">{siteDomain}</span> without logging in.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg mb-4">
          <div>
            <p className="text-sm font-medium text-text-primary">Public Access</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {isPublic ? 'Dashboard is publicly accessible' : 'Dashboard is private'}
            </p>
          </div>
          <button
            onClick={() => handleToggleShare(!isPublic)}
            disabled={toggling || loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isPublic ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
            } ${toggling || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPublic ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Share Link */}
        {isPublic && shareLink && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Your public link:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-bg-secondary border border-border rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={copyShareLink}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Anyone with this link can view your dashboard stats
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  )
}
