// Utility functions for analytics

/**
 * Generate a visitor ID hash from IP + User Agent
 * Privacy-friendly way to track unique visitors
 */
export function generateVisitorId(ip: string, userAgent: string): string {
  const data = `${ip}:${userAgent}`
  // Simple hash function (for production, use crypto.subtle.digest)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Parse user agent to extract browser, device, OS
 */
export function parseUserAgent(ua: string) {
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[1] || 'Unknown'
  const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/)?.[1] || 'Unknown'
  const device = /Mobile|Android|iPhone|iPad/.test(ua) ? 'Mobile' : 'Desktop'

  return { browser, os, device }
}

/**
 * Extract domain from referrer URL
 */
export function extractDomain(url: string | null): string {
  if (!url) return 'Direct / None'
  try {
    const domain = new URL(url).hostname
    return domain.replace('www.', '')
  } catch {
    return 'Direct / None'
  }
}
