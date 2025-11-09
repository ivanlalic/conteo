'use client'

interface PricingSectionProps {
  onPlanClick: (plan: 'free' | 'pro' | 'business') => void
}

export default function PricingSection({ onPlanClick }: PricingSectionProps) {
  const plans = [
    {
      name: 'Free',
      price: 'Free',
      pricePerMonth: null,
      sites: 1,
      eventsPerMonth: '10k',
      features: [
        'Real-time dashboard',
        'Basic metrics',
        'Event tracking',
        'CSV export',
        'GDPR compliant',
      ],
      cta: 'Start Free',
      highlighted: true,
      badge: 'Perfect to start',
      tier: 'free' as const,
    },
    {
      name: 'Pro',
      price: '$4.90',
      pricePerMonth: '/mo',
      sites: 3,
      eventsPerMonth: '50k',
      features: [
        'Everything in Free',
        '3 websites',
        '50k events/month',
        'Priority support',
        'Advanced dashboard',
      ],
      cta: 'Start with Pro',
      highlighted: false,
      badge: null,
      tier: 'pro' as const,
    },
    {
      name: 'Business',
      price: '$9.90',
      pricePerMonth: '/mo',
      sites: 10,
      eventsPerMonth: '100k',
      features: [
        'Everything in Pro',
        '10 websites',
        '100k events/month',
        'Advanced analytics',
        'API access',
      ],
      cta: 'Start with Business',
      highlighted: false,
      badge: null,
      tier: 'business' as const,
    },
  ]

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`
                relative bg-white rounded-2xl shadow-lg p-8
                ${plan.highlighted
                  ? 'border-2 border-indigo-600 transform md:scale-105'
                  : 'border border-gray-200'
                }
              `}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Name */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.pricePerMonth && (
                    <span className="text-gray-600 ml-2">
                      {plan.pricePerMonth}
                    </span>
                  )}
                </div>
              </div>

              {/* Limits */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Websites</span>
                  <span className="font-semibold text-gray-900">
                    {plan.sites} {plan.sites === 1 ? 'site' : 'sites'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Events/month</span>
                  <span className="font-semibold text-gray-900">
                    {plan.eventsPerMonth}
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => onPlanClick(plan.tier)}
                className={`
                  w-full py-3 px-6 rounded-lg font-semibold transition text-center
                  ${plan.highlighted
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }
                `}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            ✓ No credit card required · ✓ Cancel anytime · ✓ Free forever for small sites
          </p>
        </div>
      </div>
    </section>
  )
}
