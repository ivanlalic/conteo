import type { Metadata } from 'next'
import PricingCards from '@/components/landing/PricingCards'
import CTAButton from '@/components/landing/CTAButton'
import { FAQStructuredData } from '@/components/structured-data'

export const metadata: Metadata = {
  title: 'Pricing — Free Web Analytics',
  description:
    'Free web analytics for small sites. No credit card, no hidden fees. Pro from $9/mo. The free Google Analytics alternative with real-time dashboard.',
  alternates: { canonical: 'https://conteo.online/pricing' },
  openGraph: {
    title: 'Conteo Pricing — Free Analytics for Your Website',
    description:
      'Free forever for sites under 10K visits/mo. Simple, transparent pricing. No credit card required.',
    url: 'https://conteo.online/pricing',
  },
}

const PRICING_FAQS = [
  {
    question: 'Is Conteo really free?',
    answer:
      'Yes. Conteo is free forever for websites with up to 10,000 visits per month. No credit card required, no trial period, no hidden fees. You get a full real-time analytics dashboard, all basic metrics, and CSV export — completely free.',
  },
  {
    question: 'Do I need a credit card to start?',
    answer:
      'No. The free plan requires no payment information at all. Just sign up with your email, add your site, and start tracking. You only need a credit card if you upgrade to Pro.',
  },
  {
    question: 'What happens if I exceed my visit limit?',
    answer:
      "We'll notify you when you're approaching your limit. Your data keeps flowing and your dashboard stays active — we don't cut you off mid-month. You can upgrade to Pro ($9/mo) for up to 100,000 visits.",
  },
  {
    question: 'Can I upgrade or downgrade anytime?',
    answer:
      'Yes. You can switch between Free and Pro ($9/mo) at any time. Changes take effect immediately. No contracts, no lock-in periods.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes, cancel anytime with one click. No contracts, no cancellation fees. If you cancel a paid plan, you keep access until the end of your billing period, then automatically switch back to the free plan.',
  },
  {
    question: 'How does Conteo compare to Google Analytics pricing?',
    answer:
      'Google Analytics is free but you pay with your visitors\' data — Google uses it for advertising. Conteo is free up to 10,000 visits/mo with zero data sharing. Your data is yours, never sold or used for ads. For most websites, Conteo\'s free plan is all you need.',
  },
]

export default function PricingPage() {
  return (
    <>
      <FAQStructuredData faqs={PRICING_FAQS} />

      {/* Hero */}
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-16 px-6">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight mb-4">
            Free analytics. <span className="text-[#4F46E5]">Simple pricing.</span>
          </h1>
          <p className="text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Free forever for small sites. No credit card required. No hidden fees.
            The free Google Analytics alternative you&apos;ve been looking for.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6">
        <div className="max-w-[1000px] mx-auto">
          <PricingCards />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {PRICING_FAQS.map((faq, i) => (
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
            Start tracking for free
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">
            Free forever for sites under 10,000 visits/mo. Setup in 2 minutes.
          </p>
          <CTAButton
            href="/signup"
            trackLabel="pricing-cta"
            className="inline-block bg-[#4F46E5] text-white px-8 py-3.5 rounded-lg text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-[#4F46E5]/20"
          >
            Create free account &rarr;
          </CTAButton>
        </div>
      </section>
    </>
  )
}
