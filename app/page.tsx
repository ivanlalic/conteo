export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">conteo</span>
            </div>
            <div className="flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Pricing</a>
              <a href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Login</a>
              <a
                href="/signup"
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
              >
                Start Free
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Stop overpaying for<br />
              <span className="text-indigo-600">simple analytics</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Track your visitors in 2 minutes. Get insights that actually matter.
              <br />
              <span className="font-semibold text-gray-900">90% of the features at 10% of the cost.</span>
            </p>
            <p className="text-lg text-gray-500 mb-8">
              No credit card required. Free forever for small sites.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/signup"
                className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition shadow-lg"
              >
                Start tracking for free →
              </a>
              <a
                href="#demo"
                className="w-full sm:w-auto bg-white text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition"
              >
                View live demo
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              ✓ Setup in &lt;2 minutes · ✓ No cookies · ✓ GDPR compliant
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-8">Trusted by indie hackers and growing businesses</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                  T
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">TechGear Store</p>
                  <p className="text-sm text-gray-500">ecommerce · 50k/mo visitors</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm italic">
                "Switched from Google Analytics. Finally understand our traffic without the complexity. The COD tracking is a game changer."
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                  H
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">HealthyLiving.shop</p>
                  <p className="text-sm text-gray-500">ecommerce · 30k/mo visitors</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm italic">
                "Saves me $180/month compared to competitors. The dashboard loads instantly and shows exactly what I need."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                  D
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">DevTips Blog</p>
                  <p className="text-sm text-gray-500">blog · 15k/mo visitors</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm italic">
                "Setup took literally 90 seconds. Clean interface, fast loading, no bloat. Perfect for indie hackers."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need.<br />Nothing you don't.
            </h2>
            <p className="text-xl text-gray-600">
              Simple, fast, and privacy-friendly analytics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">
                Dashboard loads in &lt;1 second. No more waiting for slow analytics tools.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy First</h3>
              <p className="text-gray-600">
                No cookies. No tracking across sites. GDPR compliant out of the box.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Simple Dashboard</h3>
              <p className="text-gray-600">
                See your top pages, traffic sources, and devices at a glance. No PhD required.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Visitor Insights</h3>
              <p className="text-gray-600">
                Countries, cities, browsers, devices. Everything you need to know your audience.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">COD Tracking</h3>
              <p className="text-gray-600">
                For ecommerce: Track cash-on-delivery conversions from Facebook & TikTok pixels.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">UTM Campaigns</h3>
              <p className="text-gray-600">
                Track your marketing campaigns. Know what's working and what's not.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Transparent pricing.<br />No surprises.
            </h2>
            <p className="text-xl text-gray-600">
              Start free. Upgrade when you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">1 website</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">10,000 pageviews/month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">7 days data retention</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">All core features</span>
                </li>
              </ul>
              <a
                href="/signup"
                className="block w-full text-center bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Start Free
              </a>
            </div>

            {/* Pro Plan */}
            <div className="bg-indigo-600 rounded-lg border-2 border-indigo-600 p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$19</span>
                <span className="text-indigo-200">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-300 mr-2">✓</span>
                  <span className="text-white">3 websites</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-300 mr-2">✓</span>
                  <span className="text-white">100,000 pageviews/month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-300 mr-2">✓</span>
                  <span className="text-white">90 days data retention</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-300 mr-2">✓</span>
                  <span className="text-white">COD tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-300 mr-2">✓</span>
                  <span className="text-white">CSV exports</span>
                </li>
              </ul>
              <a
                href="/signup"
                className="block w-full text-center bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Start Pro Trial
              </a>
              <p className="text-xs text-indigo-200 text-center mt-3">
                vs Google Analytics 360: $150k/year
              </p>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">10 websites</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">1M pageviews/month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">2 years data retention</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">API access</span>
                </li>
              </ul>
              <a
                href="/signup"
                className="block w-full text-center bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Start Enterprise
              </a>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-12">
            Compare to competitors: Plausible ($9-$150/mo), Simple Analytics ($9-$148/mo), Fathom ($14-$114/mo)
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to stop overpaying?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join indie hackers who track smarter, not harder.
            <br />
            No credit card required. Cancel anytime.
          </p>
          <a
            href="/signup"
            className="inline-block bg-white text-indigo-600 px-10 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition shadow-lg"
          >
            Start tracking for free →
          </a>
          <p className="text-sm text-indigo-200 mt-6">
            Setup takes less than 2 minutes · Free forever for small sites
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-xl font-bold text-gray-900">conteo</span>
              <p className="text-sm text-gray-500 mt-1">Simple analytics for indie hackers</p>
            </div>
            <div className="flex space-x-6">
              <a href="/login" className="text-sm text-gray-600 hover:text-gray-900">Login</a>
              <a href="/signup" className="text-sm text-gray-600 hover:text-gray-900">Sign Up</a>
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              © 2025 Conteo. Built with Next.js + Supabase. Privacy-first analytics.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
