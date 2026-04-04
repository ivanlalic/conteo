import CTAButton from '@/components/landing/CTAButton'

interface BlogArticleProps {
  title: string
  publishedAt: string
  readingTime: string
  tags: string[]
  children: React.ReactNode
}

export default function BlogArticle({ title, publishedAt, readingTime, tags, children }: BlogArticleProps) {
  const formattedDate = new Date(publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      {/* Header */}
      <section className="pt-24 pb-8 sm:pt-32 sm:pb-12 px-6">
        <div className="max-w-[700px] mx-auto">
          <div className="flex items-center gap-3 text-sm text-neutral-400 dark:text-neutral-500 mb-4">
            <time dateTime={publishedAt}>{formattedDate}</time>
            <span>&middot;</span>
            <span>{readingTime}</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-4xl tracking-tight leading-tight mb-4">
            {title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="pb-16 px-6">
        <div className="max-w-[700px] mx-auto
          [&>h2]:font-display [&>h2]:font-bold [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h2]:tracking-tight [&>h2]:mt-12 [&>h2]:mb-4 [&>h2]:text-neutral-900 [&>h2]:dark:text-neutral-100
          [&>h3]:font-semibold [&>h3]:text-lg [&>h3]:mt-8 [&>h3]:mb-3 [&>h3]:text-neutral-900 [&>h3]:dark:text-neutral-100
          [&>p]:text-neutral-600 [&>p]:dark:text-neutral-300 [&>p]:leading-relaxed [&>p]:mb-5
          [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-5 [&>ul]:space-y-2 [&>ul]:text-neutral-600 [&>ul]:dark:text-neutral-300 [&>ul]:text-sm [&>ul]:leading-relaxed
          [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-5 [&>ol]:space-y-2 [&>ol]:text-neutral-600 [&>ol]:dark:text-neutral-300 [&>ol]:text-sm [&>ol]:leading-relaxed
          [&_a]:text-[#4F46E5] [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:opacity-80
          [&>blockquote]:border-l-2 [&>blockquote]:border-[#4F46E5] [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-neutral-500 [&>blockquote]:dark:text-neutral-400 [&>blockquote]:mb-5
        ">
          {children}
        </div>
      </article>

      {/* CTA */}
      <section className="py-16 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="font-display font-bold text-2xl tracking-tight mb-4">
            Try Conteo for free
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">
            Free forever for sites under 10,000 visits/mo. No cookies, no credit card.
          </p>
          <CTAButton
            href="/signup"
            trackLabel="blog-cta"
            className="inline-block bg-[#4F46E5] text-white px-8 py-3.5 rounded-lg text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-[#4F46E5]/20"
          >
            Create free account &rarr;
          </CTAButton>
        </div>
      </section>
    </>
  )
}
