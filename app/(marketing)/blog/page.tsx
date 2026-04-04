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
