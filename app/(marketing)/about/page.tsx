import type { Metadata } from 'next'
import CTAButton from '@/components/landing/CTAButton'
import { AboutPageStructuredData, BreadcrumbListStructuredData } from '@/components/structured-data'

export const metadata: Metadata = {
  title: 'About Conteo — Free, Privacy-First Web Analytics',
  description:
    'Conteo is a free, privacy-first web analytics tool. No cookies, GDPR compliant, tracking script under 1KB. Built for website owners who want simple, honest analytics.',
  alternates: { canonical: 'https://conteo.online/about' },
  openGraph: {
    title: 'About Conteo — Free, Privacy-First Web Analytics',
    description:
      'Free web analytics. No cookies, GDPR compliant, <1KB script. For website owners who want simple, honest analytics.',
    url: 'https://conteo.online/about',
  },
}

export default function AboutPage() {
  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: 'Home', url: 'https://conteo.online' },
          { name: 'About', url: 'https://conteo.online/about' },
        ]}
      />
      <AboutPageStructuredData />

      {/* Hero */}
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-16 px-6">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight mb-4">
            What is Conteo?
          </h1>
          <p className="text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Free, simple, privacy-first web analytics. No cookies, no personal data, no consent banners — just the metrics that matter.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="pb-16 px-6">
        <div className="max-w-[700px] mx-auto space-y-6 text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <p>
            Conteo is a free web analytics tool built for website owners who want to understand their traffic
            without compromising their visitors&apos; privacy. No cookies, no personal data collection,
            no consent banners — just the metrics that matter, in a clean real-time dashboard.
          </p>
          <p>
            We built Conteo because the analytics landscape is broken. Google Analytics is free but monetizes your
            visitors&apos; data for advertising. Privacy-focused alternatives exist but charge $9-19/month for
            basic features. We believe every website deserves free, private analytics.
          </p>
          <p>
            Conteo is free for websites with up to 10,000 visits per month. No credit card required.
            No trial period. No feature gating on the free plan. You get the full real-time dashboard,
            all metrics, and CSV export — free.
          </p>
        </div>
      </section>

      {/* Key Facts */}
      <section className="py-20 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display font-bold text-2xl tracking-tight mb-8">
            Key facts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: 'Tracking script size', value: '<1KB (45x smaller than Google Analytics)' },
              { label: 'Cookies used', value: 'Zero — no cookies, ever' },
              { label: 'Personal data collected', value: 'None' },
              { label: 'GDPR compliance', value: 'Yes, by design — no configuration needed' },
              { label: 'Free plan', value: '1 site, 10,000 visits/mo, all features' },
              { label: 'Paid plans', value: 'Pro $4.90/mo, Business $9.90/mo' },
              { label: 'Setup time', value: '2 minutes, one line of code' },
              { label: 'Data dashboard', value: 'Real-time, sub-second updates' },
            ].map((fact, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">{fact.label}</dt>
                <dd className="text-sm font-medium">{fact.value}</dd>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 px-6">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display font-bold text-2xl tracking-tight mb-6">
            Who Conteo is for
          </h2>
          <div className="space-y-4 text-neutral-600 dark:text-neutral-300 leading-relaxed">
            <p>
              <strong>Indie developers and makers</strong> who want to know if anyone is using what they built,
              without setting up a complex analytics platform. Free analytics that takes 2 minutes to add.
            </p>
            <p>
              <strong>Small businesses and freelancers</strong> who need to track website performance
              without paying $19/month for an analytics tool or handing their data to Google. Conteo is free
              for most small business websites.
            </p>
            <p>
              <strong>Bloggers and content creators</strong> who want to see which posts perform best,
              where readers come from, and how they found the site — all in a single free dashboard.
            </p>
            <p>
              <strong>Privacy-conscious website owners</strong> who believe their visitors shouldn&apos;t
              be tracked across the internet just because they visited a website. Free, ethical analytics.
            </p>
          </div>
        </div>
      </section>

      {/* What makes it different */}
      <section className="py-20 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display font-bold text-2xl tracking-tight mb-6">
            What makes Conteo different
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-base mb-2">Privacy by design, not as an afterthought</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Conteo doesn&apos;t collect personal data. Not because we anonymize it — because we never collect it
                in the first place. No IP addresses stored. No cookies set. No fingerprinting. No cross-site tracking.
                This isn&apos;t a feature toggle — it&apos;s how Conteo is built. Your visitors can browse your site
                without being profiled, and you can sleep well knowing your analytics don&apos;t feed an ad network.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-2">Genuinely free for small sites</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Our free plan isn&apos;t a limited trial. It includes the full real-time dashboard, all metrics, and CSV export
                for up to 10,000 visits per month. No credit card required. No feature gating.
                We make money from Pro and Business plans for larger sites — not by selling your data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-2">Simple by choice</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Google Analytics has 200+ reports. Most website owners use 5.
                Conteo gives you one dashboard with the metrics that actually matter:
                visitors, top pages, sources, countries, devices, and browsers. That&apos;s it.
                No training needed, no certification required, no two-hour setup process.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-2">Lightweight by engineering</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Our tracking script is under 1KB. Google Analytics is ~45KB. Plausible is ~1.5KB.
                Every kilobyte matters for page speed and SEO. Conteo is one of the lightest analytics
                scripts available — and it&apos;s free. A lighter script means faster pages, better Core Web Vitals,
                and higher search rankings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-4">
            Try Conteo for free
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">
            Free forever for sites under 10,000 visits/mo. Setup in 2 minutes. No cookies. No credit card.
          </p>
          <CTAButton
            href="/signup"
            trackLabel="about-cta"
            className="inline-block bg-[#4F46E5] text-white px-8 py-3.5 rounded-lg text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-[#4F46E5]/20"
          >
            Create free account &rarr;
          </CTAButton>
        </div>
      </section>
    </>
  )
}
