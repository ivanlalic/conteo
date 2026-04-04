import type { Metadata } from 'next'
import CTAButton from '@/components/landing/CTAButton'
import { FAQStructuredData } from '@/components/structured-data'
import { COMPARISON_TABLE } from '@/lib/data/marketing'

export const metadata: Metadata = {
  title: 'Conteo vs Google Analytics — Free Privacy-First Alternative',
  description:
    'Compare Conteo with Google Analytics. Free, lighter script (<1KB vs 45KB), no cookies, GDPR compliant. The free Google Analytics alternative for privacy-conscious websites.',
  alternates: { canonical: 'https://conteo.online/vs/google-analytics' },
  openGraph: {
    title: 'Conteo vs Google Analytics — Free Privacy-First Alternative',
    description:
      'A detailed, honest comparison. Free analytics without cookies, GDPR compliant by default, <1KB script.',
    url: 'https://conteo.online/vs/google-analytics',
  },
}

const VS_GA_FAQS = [
  {
    question: 'Is Conteo a free Google Analytics alternative?',
    answer:
      'Yes. Conteo is free for websites with up to 10,000 visits per month. Unlike Google Analytics, Conteo doesn\'t use cookies, doesn\'t collect personal data, and doesn\'t use your visitors\' data for advertising. It\'s the free, privacy-first alternative to GA4.',
  },
  {
    question: 'Does Conteo use cookies?',
    answer:
      'No, never. Conteo is 100% cookie-free. It uses a privacy-preserving method to count unique visitors without tracking individuals. This means you don\'t need a cookie consent banner, saving you the cost and complexity of a cookie management platform.',
  },
  {
    question: 'Can I use Conteo and Google Analytics together?',
    answer:
      'Yes. You can run both simultaneously. Many users start with both and eventually remove Google Analytics once they realize Conteo provides all the metrics they actually need — without the complexity and privacy concerns.',
  },
  {
    question: 'Is Conteo GDPR compliant?',
    answer:
      'Yes, by design. Conteo doesn\'t collect personal data, doesn\'t use cookies, and doesn\'t track users across websites. No consent banner needed. No Data Processing Agreement required. It\'s GDPR, CCPA, and PECR compliant out of the box.',
  },
  {
    question: 'Why is Conteo better than Google Analytics for small sites?',
    answer:
      'For most websites, Google Analytics is overkill. Its 200+ reports create complexity without value. Conteo gives you the metrics that matter — visitors, top pages, sources, countries, devices — in a single real-time dashboard. Plus it\'s free, privacy-first, and takes 2 minutes to set up.',
  },
  {
    question: 'How much does Conteo cost compared to Google Analytics?',
    answer:
      'Both have free tiers, but the cost model is different. Google Analytics is "free" but monetizes your visitors\' data for ads. Conteo is genuinely free up to 10,000 visits/mo with no data sharing. Pro is $4.90/mo for 50K visits, Business is $9.90/mo for 100K visits. Your data is never sold.',
  },
]

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-neutral-300 dark:text-neutral-600">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function VsGoogleAnalyticsPage() {
  return (
    <>
      <FAQStructuredData faqs={VS_GA_FAQS} />

      {/* Hero */}
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-16 px-6">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight mb-4">
            Conteo vs Google Analytics
          </h1>
          <p className="text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            An honest comparison. See why thousands of websites are switching to
            a <strong>free, privacy-first</strong> Google Analytics alternative.
          </p>
        </div>
      </section>

      {/* Quick Verdict */}
      <section className="pb-12 px-6">
        <div className="max-w-[800px] mx-auto">
          <div className="rounded-xl border-2 border-[#4F46E5]/20 bg-[#4F46E5]/5 dark:bg-[#4F46E5]/10 p-6 sm:p-8">
            <h2 className="font-display font-bold text-lg mb-3 text-[#4F46E5]">Quick verdict</h2>
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              <strong>Google Analytics</strong> is powerful but complex — 200+ reports, cookies required, GDPR configuration needed, and your data is used for Google&apos;s ad network.{' '}
              <strong>Conteo</strong> is a free, simple alternative: one dashboard with the metrics that matter, no cookies, GDPR compliant by default, and a tracking script that&apos;s 45x smaller.
              For most websites, Conteo is all you need.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-6">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-center mb-10">
            Feature-by-feature comparison
          </h2>
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                  <th className="text-left px-6 py-4 font-semibold">Feature</th>
                  <th className="text-left px-6 py-4 font-semibold text-neutral-400">Google Analytics</th>
                  <th className="text-left px-6 py-4 font-semibold text-[#4F46E5]">Conteo (free)</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_TABLE.map((row, i) => (
                  <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                    <td className="px-6 py-4 font-medium">{row.feature}</td>
                    <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">{row.ga}</td>
                    <td className="px-6 py-4 text-neutral-700 dark:text-neutral-200">{row.conteo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Key Differences */}
      <section className="py-20 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-[800px] mx-auto space-y-16">
          <div>
            <h2 className="font-display font-bold text-2xl tracking-tight mb-4">
              45x lighter tracking script — free
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
              Google Analytics loads a ~45KB script on every page view. Conteo&apos;s tracking script is under 1KB — 45 times smaller.
              This means faster page loads, better Core Web Vitals scores, and a better experience for your visitors.
              And it&apos;s completely free for sites under 10,000 visits per month.
            </p>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Every kilobyte matters for SEO and user experience. Google itself ranks faster websites higher.
              By switching from Google Analytics to Conteo, you&apos;re removing 45KB of JavaScript from every page load — for free.
            </p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl tracking-tight mb-4">
              Zero cookies, zero consent banners
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
              Google Analytics requires cookies and a consent banner to comply with GDPR.
              Managing cookie consent is a headache: you need a Cookie Management Platform (CMP),
              you lose data from visitors who reject cookies, and you risk fines if your implementation is wrong.
            </p>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Conteo uses zero cookies. No consent banner needed. No CMP costs. No GDPR configuration.
              It&apos;s free, private analytics that works out of the box.
            </p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl tracking-tight mb-4">
              Your data stays yours
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
              When you use Google Analytics, Google processes your visitors&apos; data and uses it across their advertising network.
              Your visitors become data points for Google Ads. That&apos;s the real cost of &quot;free.&quot;
            </p>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              With Conteo, your analytics data is yours. We never sell it, share it, or use it for advertising.
              We make money from paid plans, not from your data. Free plan included.
            </p>
          </div>
        </div>
      </section>

      {/* When to use GA */}
      <section className="py-20 px-6">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-display font-bold text-2xl tracking-tight mb-4">
            When Google Analytics is the better choice
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
            We believe in honesty. Google Analytics is better if you need:
          </p>
          <ul className="space-y-3 mb-6">
            {[
              'Advanced e-commerce tracking (product views, cart abandonment, checkout funnels)',
              'Custom event funnels and conversion path analysis',
              'Integration with Google Ads for campaign attribution',
              'A/B testing with Google Optimize',
              'Audience segmentation for remarketing',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                <span className="flex-shrink-0 mt-0.5"><IconX /></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            For everything else — knowing how many people visit your site, which pages they view, where they come from,
            and what devices they use — <strong>Conteo&apos;s free plan gives you everything you need</strong> without
            the complexity, cookies, or privacy concerns.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {VS_GA_FAQS.map((faq, i) => (
              <details
                key={i}
                className="group rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-sm font-semibold select-none">
                  {faq.question}
                  <span className="ml-4 text-neutral-400 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <p className="px-6 pb-4 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-4">
            Try the free Google Analytics alternative
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">
            Free forever for sites under 10,000 visits/mo. Setup in 2 minutes. No cookies.
          </p>
          <CTAButton
            href="/signup"
            trackLabel="vs-ga-cta"
            className="inline-block bg-[#4F46E5] text-white px-8 py-3.5 rounded-lg text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-[#4F46E5]/20"
          >
            Start free — no credit card &rarr;
          </CTAButton>
        </div>
      </section>
    </>
  )
}
