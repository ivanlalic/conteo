export const PLANS = [
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

export const GA_POINTS = [
  '45KB script that slows down your site',
  'Requires a cookie banner to comply with GDPR',
  "Your visitors' data is used for Google ads",
  'Dashboard with 200+ reports nobody understands',
  'You need a course to set up GA4',
  'Processed data, not real-time',
]

export const CONTEO_POINTS = [
  "<1KB script. Your site won't even notice",
  'No cookies. GDPR compliant out of the box',
  'Your data is yours. Never sold or shared',
  'One dashboard, one page, everything you need',
  'Setup in 2 minutes, zero configuration',
  'Real-time data',
]

export const COMPARISON_TABLE = [
  { feature: 'Price', ga: 'Free (you pay with your data)', conteo: 'Free up to 10K visits/mo, then $4.90/mo' },
  { feature: 'Script size', ga: '~45KB', conteo: '<1KB (45x lighter)' },
  { feature: 'Cookies', ga: 'Yes (requires consent banner)', conteo: 'None — zero cookies' },
  { feature: 'GDPR compliance', ga: 'Requires configuration + consent', conteo: 'Compliant by default, no setup' },
  { feature: 'Setup time', ga: 'Hours (GA4 is complex)', conteo: '2 minutes, one line of code' },
  { feature: 'Real-time data', ga: 'Limited, processed with delay', conteo: 'Yes, live sub-second updates' },
  { feature: 'Dashboard', ga: '200+ reports, steep learning curve', conteo: 'Single page, everything you need' },
  { feature: 'Data ownership', ga: 'Google uses it for ads', conteo: 'Yours. Never sold or shared' },
  { feature: 'Cookie banner needed', ga: 'Yes', conteo: 'No' },
  { feature: 'Data retention', ga: 'Configurable', conteo: '30 days free, 90 days Pro, unlimited Business' },
  { feature: 'Personal data collected', ga: 'Yes (IP, demographics, interests)', conteo: 'None' },
]
