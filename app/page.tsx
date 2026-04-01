'use client'

import { useState, useEffect } from 'react'
import PricingModal from '@/components/PricingModal'

// ── SVG Icons (stroke-based, 22px) ──────────────────────────────────────────

function IconActivity() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconShieldCheck() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function IconBarChart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function IconGlobe() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function IconDownload() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function IconCheckSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconXSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

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

// ── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: <IconActivity />, title: 'Real-time dashboard', desc: 'Live visitors, pageviews by the hour, everything updated to the second.' },
  { icon: <IconShield />, title: 'No cookies', desc: 'Zero cookies, zero consent banners, zero legal headaches.' },
  { icon: <IconShieldCheck />, title: 'GDPR compliant', desc: 'Privacy-first by design. We don\'t collect personal data.' },
  { icon: <IconBarChart />, title: 'Top pages & sources', desc: 'Know which pages work and where your traffic comes from.' },
  { icon: <IconGlobe />, title: 'Countries & devices', desc: 'Flags, cities, desktop vs mobile, browsers and more.' },
  { icon: <IconDownload />, title: 'Export CSV', desc: 'Download your data anytime. It\'s yours, always.' },
]

const SNIPPETS: Record<string, { label: string; code: string }> = {
  html: {
    label: 'HTML',
    code: '<script defer\n  src="https://conteo.online/tracker.js"\n  data-api-key="YOUR_API_KEY">\n</script>',
  },
  wordpress: {
    label: 'WordPress',
    code: '<!-- Appearance > Theme Editor >\n   header.php, before </head> -->\n<script defer\n  src="https://conteo.online/tracker.js"\n  data-api-key="YOUR_API_KEY">\n</script>',
  },
  shopify: {
    label: 'Shopify',
    code: '<!-- Online Store > Themes > Edit code\n   > theme.liquid, before </head> -->\n<script defer\n  src="https://conteo.online/tracker.js"\n  data-api-key="YOUR_API_KEY">\n</script>',
  },
  nextjs: {
    label: 'Next.js',
    code: "// app/layout.tsx\nimport Script from 'next/script'\n\nexport default function Layout({ children }) {\n  return (\n    <html>\n      <body>\n        {children}\n        <Script\n          src=\"https://conteo.online/tracker.js\"\n          data-api-key=\"YOUR_API_KEY\"\n          strategy=\"afterInteractive\"\n        />\n      </body>\n    </html>\n  )\n}",
  },
}

const GA_POINTS = [
  '45KB script that slows down your site',
  'Requires a cookie banner to comply with GDPR',
  'Your visitors\' data is used for Google ads',
  'Dashboard with 200+ reports nobody understands',
  'You need a course to set up GA4',
  'Processed data, not real-time',
]

const CONTEO_POINTS = [
  '<1KB script. Your site won\'t even notice',
  'No cookies. GDPR compliant out of the box',
  'Your data is yours. Never sold or shared',
  'One dashboard, one page, everything you need',
  'Setup in 2 minutes, zero configuration',
  'Real-time data',
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    badge: null,
    features: ['1 site', '10,000 visits/mo', 'Real-time dashboard', 'All basic metrics', 'CSV export', 'Data retention: 30 days'],
    cta: 'Start for free',
    highlighted: false,
    plan: 'free' as const,
  },
  {
    name: 'Pro',
    price: '$4.90',
    period: '/mo',
    badge: 'Popular',
    features: ['3 sites', '50,000 visits/mo', 'Everything in Free', 'Public shareable dashboard', 'Priority support', 'Data retention: 90 days'],
    cta: 'Start with Pro',
    highlighted: true,
    plan: 'pro' as const,
  },
  {
    name: 'Business',
    price: '$9.90',
    period: '/mo',
    badge: null,
    features: ['10 sites', '100,000 visits/mo', 'Everything in Pro', 'API access', 'Unlimited data retention'],
    cta: 'Start with Business',
    highlighted: false,
    plan: 'business' as const,
  },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('html')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'Pro' | 'Business'>('Pro')
  const [dark, setDark] = useState(false)

  useEffect(() => {
    // Self-tracking
    const script = document.createElement('script')
    script.src = '/tracker.js'
    script.setAttribute('data-api-key', '15237fb4-68f1-4fe9-85fd-c63f1715c42c')
    script.defer = true
    document.head.appendChild(script)

    // Dark mode
    const stored = localStorage.getItem('conteo-theme')
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
      setDark(true)
    }

    return () => { if (script.parentNode) document.head.removeChild(script) }
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('conteo-theme', next ? 'dark' : 'light')
  }

  function handleCopy() {
    navigator.clipboard.writeText(SNIPPETS[activeTab].code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function trackCTA(location: string) {
    if (typeof window !== 'undefined' && (window as any).conteo) {
      (window as any).conteo.trackEvent('CTA Click', { props: { location } })
    }
  }

  function handlePlanClick(plan: 'free' | 'pro' | 'business') {
    trackCTA(`pricing-${plan}`)
    if (plan === 'free') {
      window.location.href = '/signup'
    } else {
      setSelectedPlan(plan === 'pro' ? 'Pro' : 'Business')
      setIsModalOpen(true)
    }
  }

  const DEMO_URL = '/demo'

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="font-display font-bold text-xl tracking-tight">conteo</a>
          <div className="flex items-center gap-5">
            <a href="#features" className="hidden sm:inline text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition">Features</a>
            <a href="#pricing" className="hidden sm:inline text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition">Pricing</a>
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

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-dot-grid pt-24 pb-20 sm:pt-32 sm:pb-28 px-6 overflow-hidden">
        <div className="max-w-[1100px] mx-auto text-center">
          <h1 className="animate-fade-up font-display font-extrabold text-[2rem] leading-[1.1] sm:text-5xl lg:text-[3.4rem] tracking-tight mb-6">
            Know who visits your site.
            <br />
            <span className="text-[#4F46E5]">No cookies, no hassle.</span>
          </h1>
          <p className="animate-fade-up animate-delay-100 text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            One line of code. Real-time dashboard. No cookies, GDPR compliant, and free for small sites.
          </p>
          <div className="animate-fade-up animate-delay-200 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#demo" onClick={() => trackCTA('hero-demo')} className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-7 py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition">
              See live demo &darr;
            </a>
            <a href="/signup" onClick={() => trackCTA('hero-signup')} className="border border-neutral-300 dark:border-neutral-700 px-7 py-3 rounded-lg text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition">
              Start free
            </a>
          </div>
          <p className="animate-fade-up animate-delay-300 text-xs text-neutral-400 dark:text-neutral-500 mt-6 tracking-wide">
            Setup in 2 minutes &middot; No credit card &middot; Free up to 10k visits/mo
          </p>
        </div>
      </section>

      {/* ── Live Demo ────────────────────────────────────────────────────── */}
      <section id="demo" className="py-20 sm:py-28 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-center mb-3">
            This is our dashboard. With real data. Right now.
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-10 max-w-xl mx-auto">
            These are the stats for this very page you're viewing. That's how simple Conteo is.
          </p>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-lg bg-white dark:bg-neutral-900">
            <iframe
              src={DEMO_URL}
              className="w-full h-[600px] sm:h-[700px]"
              title="Conteo live demo dashboard"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ── Setup Snippet ────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-6">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-center mb-3">
            One line. Two minutes. Done.
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-8">
            Paste this line in your site's <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono">&lt;head&gt;</code>. That's it.
          </p>

          {/* Tabs */}
          <div className="flex gap-1 mb-0 bg-neutral-100 dark:bg-neutral-800 rounded-t-lg p-1 overflow-x-auto">
            {Object.entries(SNIPPETS).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                  activeTab === key
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Code block */}
          <div className="relative code-block rounded-b-lg overflow-hidden">
            <pre className="p-5 text-[13px] leading-relaxed overflow-x-auto font-mono">
              <code>{SNIPPETS[activeTab].code}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-neutral-300 px-2.5 py-1.5 rounded-md text-xs font-medium transition"
            >
              {copied ? (
                <>
                  <IconCheckSmall />
                  Copied
                </>
              ) : (
                <>
                  <IconCopy />
                  Copy
                </>
              )}
            </button>
          </div>

          <p className="text-center text-sm text-neutral-400 dark:text-neutral-500 mt-4">
            Data starts flowing in immediately.
          </p>
        </div>
      </section>

      {/* ── Comparison vs GA ─────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-center mb-3">
            Google Analytics is free. But it costs more than you think.
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-12 max-w-xl mx-auto">
            Google Analytics isn't bad. It's just too much for most websites.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GA column */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Google Analytics</span>
              </div>
              <ul className="space-y-4">
                {GA_POINTS.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-500 dark:text-neutral-400">
                    <span className="flex-shrink-0 mt-0.5 text-neutral-300 dark:text-neutral-600"><IconXSmall /></span>
                    <span className="text-sm leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Conteo column */}
            <div className="rounded-xl border-2 border-[#4F46E5]/30 bg-white dark:bg-neutral-900 p-6 sm:p-8 ring-1 ring-[#4F46E5]/10">
              <div className="flex items-center gap-2 mb-6">
                <span className="font-display font-bold text-sm uppercase tracking-wider text-[#4F46E5]">Conteo</span>
              </div>
              <ul className="space-y-4">
                {CONTEO_POINTS.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-0.5 text-[#4F46E5]"><IconCheckSmall /></span>
                    <span className="text-sm leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-center text-sm text-neutral-400 dark:text-neutral-500 mt-8 max-w-lg mx-auto">
            Conteo gives you what matters, without the complexity.
          </p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28 px-6">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-center mb-3">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-14 max-w-md mx-auto">
            Only features that exist and work. No empty promises.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {FEATURES.map((f, i) => (
              <div key={i} className="group">
                <div className="text-[#4F46E5] mb-3 transition-transform group-hover:translate-x-1">{f.icon}</div>
                <h3 className="font-semibold text-base mb-1.5">{f.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-center mb-3">
            Simple pricing. No surprises.
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-12">
            No credit card to start. Cancel anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 sm:p-8 flex flex-col ${
                  plan.highlighted
                    ? 'border-2 border-[#4F46E5] bg-white dark:bg-neutral-900 ring-1 ring-[#4F46E5]/10 relative'
                    : 'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4F46E5] text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <div className="mb-6">
                  <h3 className="font-display font-bold text-lg mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-extrabold text-3xl tracking-tight">{plan.price}</span>
                    <span className="text-sm text-neutral-400">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="flex-shrink-0 mt-0.5 text-[#4F46E5]"><IconCheckSmall /></span>
                      <span className="text-neutral-600 dark:text-neutral-300">{feat}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanClick(plan.plan)}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition ${
                    plan.highlighted
                      ? 'bg-[#4F46E5] text-white hover:opacity-90'
                      : 'border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-neutral-400 dark:text-neutral-500 mt-8">
            Free forever for small sites.
          </p>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#4F46E5]/[0.03] to-transparent dark:from-[#4F46E5]/[0.05]" />
        <div className="max-w-[600px] mx-auto text-center relative">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-4">
            Start tracking in 2 minutes
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">
            Free forever for sites with less than 10,000 visits per month.
          </p>
          <a
            href="/signup"
            onClick={() => trackCTA('bottom')}
            className="inline-block bg-[#4F46E5] text-white px-8 py-3.5 rounded-lg text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-[#4F46E5]/20"
          >
            Create free account &rarr;
          </a>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-10 px-6">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-display font-bold text-lg">conteo</span>
          <div className="flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
            <a href="/login" className="hover:text-neutral-900 dark:hover:text-white transition">Login</a>
            <a href="/signup" className="hover:text-neutral-900 dark:hover:text-white transition">Sign Up</a>
          </div>
        </div>
        <div className="max-w-[1100px] mx-auto mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800/50 text-center">
          <p className="text-xs text-neutral-400 dark:text-neutral-600">
            &copy; 2026 Conteo. Simple and private analytics.
          </p>
        </div>
      </footer>

      {/* Pricing Modal */}
      <PricingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} planName={selectedPlan} />
    </div>
  )
}
