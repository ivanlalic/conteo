import type { Metadata } from 'next'
import Link from 'next/link'
import { BLOG_POSTS } from '@/lib/data/blog-posts'
import { BreadcrumbListStructuredData, FAQStructuredData } from '@/components/structured-data'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Articles about free web analytics, privacy-first tracking, and building a better internet. Tips on analytics without cookies, GDPR compliance, and Google Analytics alternatives.',
  alternates: { canonical: 'https://conteo.online/blog' },
  openGraph: {
    title: 'Conteo Blog — Free Analytics & Privacy',
    description:
      'Articles about free web analytics, privacy-first tracking, and the future of analytics.',
    url: 'https://conteo.online/blog',
  },
}

const BLOG_TOPICS = [
  { topic: 'Free analytics', desc: 'Tools and tips for zero-cost tracking that respects your visitors and your budget' },
  { topic: 'Privacy & GDPR', desc: 'Cookie-free, fully compliant analytics that need no consent banner' },
  { topic: 'Google Analytics alternatives', desc: 'Honest comparisons, migration guides, and switching tips' },
  { topic: 'Web performance', desc: 'Lightweight scripts, fast pages, and why every kilobyte matters for SEO' },
  { topic: 'Small business', desc: 'Analytics for indie devs, creators, and small teams on a budget' },
  { topic: 'Conteo updates', desc: 'New features, product improvements, and what we\'re building next' },
]

const BLOG_FAQS = [
  {
    question: 'What is the Conteo blog about?',
    answer:
      'The Conteo blog covers free web analytics, privacy-first tracking, and Google Analytics alternatives. We write practical guides for website owners who want simple, honest analytics without cookies, consent banners, or complex setups.',
  },
  {
    question: 'Who should read the Conteo blog?',
    answer:
      'Indie developers, small business owners, bloggers, and anyone looking for a free, privacy-respecting alternative to Google Analytics. If you care about your visitors\' privacy and want analytics that just work, our articles are for you.',
  },
  {
    question: 'How often do you publish new articles?',
    answer:
      'We publish new articles regularly, focusing on quality over quantity. Topics include analytics comparisons, GDPR compliance tips, web performance advice, and Conteo product updates. Subscribe or check back weekly for new content.',
  },
]

export default function BlogIndex() {
  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: 'Home', url: 'https://conteo.online' },
          { name: 'Blog', url: 'https://conteo.online/blog' },
        ]}
      />

      {/* Hero */}
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-16 px-6">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight mb-4">
            Blog
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Thoughts on free web analytics, privacy, and building a better internet.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="pb-12 px-6">
        <div className="max-w-[700px] mx-auto text-neutral-600 dark:text-neutral-300 leading-relaxed space-y-4">
          <p>
            The Conteo blog covers practical guides on <strong>free web analytics</strong>, privacy-first tracking,
            and building a better internet. Whether you&apos;re comparing <strong>Google Analytics alternatives</strong>,
            learning about GDPR-compliant tracking, or looking for tips on analytics without cookies,
            you&apos;ll find honest, actionable articles here.
          </p>
          <p>
            We write about what matters: real-time dashboards that work, lightweight scripts that don&apos;t
            slow down your site, and analytics that respect your visitors&apos; privacy — all without
            the complexity or cost of traditional analytics platforms.
          </p>
          <p>
            Every article is written from real experience. We use Conteo on our own site, and we test every
            alternative we compare. Our goal is to help you make informed decisions about analytics — without
            the marketing spin you&apos;ll find elsewhere. If a competitor does something better, we&apos;ll say so.
          </p>
        </div>
      </section>

      {/* Topics */}
      <section className="pb-12 px-6">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display font-bold text-lg tracking-tight mb-4">What we cover</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BLOG_TOPICS.map((item) => (
              <div key={item.topic} className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
                <h3 className="font-semibold text-sm mb-0.5">{item.topic}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="pb-20 px-6">
        <div className="max-w-[700px] mx-auto space-y-6">
          {BLOG_POSTS.map((post) => {
            const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })

            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block group rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 hover:border-[#4F46E5]/30 dark:hover:border-[#4F46E5]/30 transition"
              >
                <div className="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500 mb-3">
                  <time dateTime={post.publishedAt}>{formattedDate}</time>
                  <span>&middot;</span>
                  <span>{post.readingTime}</span>
                </div>
                <h2 className="font-display font-bold text-lg sm:text-xl tracking-tight mb-2 group-hover:text-[#4F46E5] transition">
                  {post.title}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                  {post.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display font-bold text-2xl tracking-tight text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {BLOG_FAQS.map((faq, i) => (
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

      <FAQStructuredData faqs={BLOG_FAQS} />
    </>
  )
}
