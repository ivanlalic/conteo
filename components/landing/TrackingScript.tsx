'use client'

import { useEffect } from 'react'

export default function TrackingScript() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '/tracker.js'
    script.setAttribute('data-api-key', '15237fb4-68f1-4fe9-85fd-c63f1715c42c')
    script.defer = true
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) document.head.removeChild(script)
    }
  }, [])

  return null
}
