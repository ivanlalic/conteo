'use client'

import { useState } from 'react'
import PricingModal from '@/components/PricingModal'
import { PLANS } from '@/lib/data/marketing'

function IconCheckSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function trackCTA(location: string) {
  if (typeof window !== 'undefined' && (window as any).conteo) {
    (window as any).conteo.trackEvent('CTA Click', { props: { location } })
  }
}

export default function PricingCards() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  function handlePlanClick(plan: 'free' | 'pro') {
    trackCTA(`pricing-${plan}`)
    if (plan === 'free') {
      window.location.href = '/signup'
    } else {
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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

      <PricingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
