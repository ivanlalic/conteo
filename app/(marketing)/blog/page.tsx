import type { Metadata } from 'next'
import Link from 'next/link'
import { BLOG_POSTS } from '@/lib/data/blog-posts'

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
  { topic: 'Free analytics', desc: 'Tools and tips for zero-cost tracking' },
  { topic: 'Privacy & GDPR', desc: 'Cookie-free, compliant analytics' },
  { topic: 'Google Analytics alternatives', desc: 'Honest comparisons and migration guides' },
  { topic: 'Web performance', desc: 'Lightweight scripts and fast pages' },
  { topic: 'Small business', desc: 'Analytics for indie devs and creators' },
  { topic: 'Conteo updates', desc: 'New features and product news' },
]

export default function BlogIndex() {
  return (
    <>
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
    </>
  )
}
