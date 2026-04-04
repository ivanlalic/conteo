import type { Metadata } from 'next'
import BlogArticle from '@/components/landing/BlogArticle'
import { ArticleStructuredData } from '@/components/structured-data'
import { BLOG_POSTS } from '@/lib/data/blog-posts'

const post = BLOG_POSTS.find((p) => p.slug === 'why-we-built-conteo')!

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: { canonical: `https://conteo.online/blog/${post.slug}` },
  openGraph: {
    title: post.title,
    description: post.description,
    url: `https://conteo.online/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.publishedAt,
  },
}

export default function WhyWeBuiltConteo() {
  return (
    <>
      <ArticleStructuredData
        title={post.title}
        description={post.description}
        publishedAt={post.publishedAt}
        author={post.author}
        url={`https://conteo.online/blog/${post.slug}`}
      />

      <BlogArticle
        title={post.title}
        publishedAt={post.publishedAt}
        readingTime={post.readingTime}
        tags={post.tags}
      >
        <p>
          We built Conteo because we were tired of the false choice in web analytics: either hand your visitors&apos;
          data to Google, or pay $9-19/month for a privacy-focused alternative. We wanted a third option —
          <strong> free, private analytics that anyone can use</strong>.
        </p>

        <h2>The problem with modern analytics</h2>

        <p>
          Google Analytics is the default choice for most websites. It&apos;s free, powerful, and deeply integrated
          with the Google ecosystem. But &quot;free&quot; has a cost: Google processes your visitors&apos; data and uses it
          across their advertising network. Your visitors become data points for Google Ads.
        </p>

        <p>
          Then there&apos;s the complexity. GA4 launched with a completely redesigned interface that confused
          even experienced marketers. Setting up events, configuring conversions, understanding the new data model —
          it requires hours of learning for features most websites don&apos;t need.
        </p>

        <p>
          And cookies. GDPR requires consent for analytics cookies, which means cookie banners, consent management
          platforms, and losing data from visitors who (rightfully) click &quot;reject.&quot; Studies show that
          30-40% of European visitors reject cookie consent, meaning your analytics are incomplete from day one.
        </p>

        <h2>What we wanted instead</h2>

        <p>
          We asked ourselves: what does a typical website owner actually need from analytics?
        </p>

        <ul>
          <li>How many people visited my site today?</li>
          <li>Which pages are most popular?</li>
          <li>Where is my traffic coming from?</li>
          <li>What countries and devices are my visitors using?</li>
          <li>Is my traffic growing or shrinking?</li>
        </ul>

        <p>
          That&apos;s it. Five questions. You don&apos;t need 200+ reports, custom dimensions, or a certification
          course to answer them. You need a single dashboard that shows the numbers clearly and updates in real time.
        </p>

        <h2>How Conteo works</h2>

        <p>
          Conteo tracks page views without cookies or personal data. Our tracking script is under 1KB —
          <strong> 45 times smaller than Google Analytics</strong>. It loads instantly and doesn&apos;t slow down your site.
        </p>

        <p>
          Instead of tracking individual users with cookies, Conteo uses a privacy-preserving method to count
          unique visitors. No IP addresses are stored. No fingerprinting. No cross-site tracking. The data
          we collect can never be used to identify individual people.
        </p>

        <p>
          This means <strong>no cookie consent banner needed</strong>. Conteo is{' '}
          <a href="/vs/google-analytics">GDPR, CCPA, and PECR compliant</a> out of the box.
          You add one script tag and your analytics dashboard starts showing real-time data immediately.
        </p>

        <h2>Free by default</h2>

        <p>
          Most privacy-focused analytics tools charge $9-19/month for basic features. We think that&apos;s a barrier
          that keeps small websites stuck with Google Analytics — not because they prefer it, but because they
          can&apos;t justify the cost of alternatives.
        </p>

        <p>
          <strong>Conteo is <a href="/pricing">free for websites with up to 10,000 visits per month</a></strong>.
          No credit card. No trial period. No feature gating. You get the full real-time dashboard, all metrics,
          and CSV export — completely free.
        </p>

        <p>
          We make money from <a href="/pricing">Pro ($4.90/mo) and Business ($9.90/mo) plans</a> for larger websites
          that need more sites, higher visit limits, and longer data retention. We don&apos;t make money from your data.
          That&apos;s the key difference from Google Analytics.
        </p>

        <h2>What&apos;s next</h2>

        <p>
          Conteo is just getting started. We&apos;re working on features that privacy-conscious website owners
          have been asking for: custom events, goal tracking, email reports, and more detailed traffic source analysis.
          All while keeping the dashboard simple, the script lightweight, and the free tier generous.
        </p>

        <p>
          If you&apos;ve been looking for a{' '}
          <a href="/vs/google-analytics">free Google Analytics alternative</a> that respects your visitors&apos;
          privacy, <a href="/signup">give Conteo a try</a>. Setup takes 2 minutes, and you might find that
          the five metrics on one dashboard are all you ever needed.
        </p>

        <p>
          <em>
            Read next:{' '}
            <a href="/blog/google-analytics-vs-privacy-alternatives-2026">
              Google Analytics vs Privacy-First Alternatives in 2026
            </a>
          </em>
        </p>
      </BlogArticle>
    </>
  )
}
