'use client'

import { useTheme } from '@/components/ThemeProvider'

function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function trackCTA(location: string) {
  if (typeof window !== 'undefined' && (window as any).conteo) {
    (window as any).conteo.trackEvent('CTA Click', { props: { location } })
  }
}

export default function Navbar() {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === 'dark'

  function toggleDark() {
    setTheme(dark ? 'light' : 'dark')
  }

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
        <a href="/" className="font-display font-bold text-xl tracking-tight">conteo</a>
        <div className="flex items-center gap-5">
          <a href="/#features" className="hidden sm:inline text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition">Features</a>
          <a href="/pricing" className="hidden sm:inline text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition">Pricing</a>
          <a href="/docs" className="hidden sm:inline text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition">Docs</a>
          <a href="/blog" className="hidden sm:inline text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition">Blog</a>
          <a href="/login" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition">Log in</a>
          <button onClick={toggleDark} className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-500 dark:text-neutral-400" aria-label="Toggle theme">
            {dark ? <IconSun /> : <IconMoon />}
          </button>
          <a href="/signup" onClick={() => trackCTA('nav')} className="bg-[#4F46E5] text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:opacity-90 transition">
            Start free
          </a>
        </div>
      </div>
    </nav>
  )
}
