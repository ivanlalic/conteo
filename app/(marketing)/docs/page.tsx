import type { Metadata } from 'next'
import CodeSnippets from '@/components/landing/CodeSnippets'
import CTAButton from '@/components/landing/CTAButton'
import { HowToStructuredData } from '@/components/structured-data'

export const metadata: Metadata = {
  title: 'Setup Guide — Add Free Analytics in 2 Minutes',
  description:
    'Add free web analytics to your website in 2 minutes. Setup guides for HTML, WordPress, Shopify, and Next.js. One line of code, no configuration, no cookies.',
  alternates: { canonical: 'https://conteo.online/docs' },
  openGraph: {
    title: 'Conteo Setup Guide — Free Analytics in 2 Minutes',
    description:
      'Add free, privacy-first analytics to your site. Guides for HTML, WordPress, Shopify, Next.js.',
    url: 'https://conteo.online/docs',
  },
}

export default function DocsPage() {
  return (
    <>
      <HowToStructuredData />

      {/* Hero */}
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-16 px-6">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight mb-4">
            Add free analytics in <span className="text-[#4F46E5]">2 minutes</span>
          </h1>
          <p className="text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            One line of code. No configuration. No cookies. Free forever for small sites.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="pb-16 px-6">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display font-bold text-2xl tracking-tight mb-8">
            How to set up free analytics
          </h2>
          <ol className="space-y-8">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4F46E5] text-white text-sm font-bold flex items-center justify-center">1</span>
              <div>
                <h3 className="font-semibold text-base mb-1">Create a free account</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  <a href="/signup" className="text-[#4F46E5] hover:underline">Sign up at conteo.online</a> — free, no credit card required.
                  Your free account includes a real-time dashboard, all basic metrics, and CSV export.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4F46E5] text-white text-sm font-bold flex items-center justify-center">2</span>
              <div>
                <h3 className="font-semibold text-base mb-1">Add your website</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Enter your website domain in the Conteo dashboard. You&apos;ll get a unique API key for your site.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4F46E5] text-white text-sm font-bold flex items-center justify-center">3</span>
              <div>
                <h3 className="font-semibold text-base mb-1">Copy the tracking script</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Copy the one-line script tag. It&apos;s under 1KB — 45x smaller than Google Analytics.
                  No cookies, no consent banner needed.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4F46E5] text-white text-sm font-bold flex items-center justify-center">4</span>
              <div>
                <h3 className="font-semibold text-base mb-1">Paste into your site</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Add the script before the closing <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono">&lt;/head&gt;</code> tag.
                  Data starts flowing into your free dashboard immediately.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Platform-specific snippets */}
      <section className="bg-neutral-50 dark:bg-neutral-900/50">
        <CodeSnippets />
      </section>

      {/* What gets tracked */}
      <section className="py-20 px-6">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display font-bold text-2xl tracking-tight mb-6">
            What your free dashboard tracks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider text-[#4F46E5] mb-3">Included (free)</h3>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                {[
                  'Page views and unique visitors',
                  'Top pages (most visited)',
                  'Traffic sources and referrers',
                  'Countries and cities',
                  'Devices, browsers, and OS',
                  'Real-time live dashboard',
                  'CSV data export',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider text-neutral-400 mb-3">Never collected</h3>
              <ul className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
                {[
                  'Personal data or PII',
                  'IP addresses',
                  'Cookies or fingerprints',
                  'Cross-site tracking',
                  'Demographic profiles',
                  'Browsing history',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="py-20 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display font-bold text-2xl tracking-tight mb-8">
            Troubleshooting
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-base mb-2">I don&apos;t see any data</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Check that the script tag is correctly placed before <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono">&lt;/head&gt;</code> and
                that your API key matches the one in your dashboard. Data appears within seconds of the first visit.
                Check the browser console for any errors.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-2">Does it work with single-page apps (SPAs)?</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Yes. Conteo automatically detects client-side route changes in React, Next.js, Vue, and other SPA frameworks.
                No additional configuration needed.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-2">Does it work behind ad blockers?</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Some ad blockers may block third-party analytics scripts. Because Conteo is privacy-first and doesn&apos;t use cookies
                or track users, many ad blockers allow it. However, aggressive blockers may still block the script.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-4">
            Ready to start? It&apos;s free.
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">
            Free forever for sites under 10,000 visits/mo. No credit card required.
          </p>
          <CTAButton
            href="/signup"
            trackLabel="docs-cta"
            className="inline-block bg-[#4F46E5] text-white px-8 py-3.5 rounded-lg text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-[#4F46E5]/20"
          >
            Create free account &rarr;
          </CTAButton>
        </div>
      </section>
    </>
  )
}
