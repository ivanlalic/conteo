export interface BlogPost {
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  author: string
  tags: string[]
  readingTime: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'google-analytics-vs-privacy-alternatives-2026',
    title: 'Google Analytics vs Privacy-First Alternatives in 2026',
    description:
      'A 2026 comparison of Google Analytics and free privacy-first alternatives like Conteo, Plausible, and Fathom. Which free analytics tool is right for your website?',
    publishedAt: '2026-04-04',
    author: 'Conteo',
    tags: ['comparison', 'google analytics', 'privacy'],
    readingTime: '7 min read',
  },
  {
    slug: 'why-we-built-conteo',
    title: 'Why We Built Conteo: A Free, Privacy-First Analytics Tool',
    description:
      'The story behind Conteo — why we built a free, cookie-free Google Analytics alternative focused on simplicity, privacy, and honest analytics.',
    publishedAt: '2026-04-04',
    author: 'Conteo',
    tags: ['privacy', 'analytics', 'brand story'],
    readingTime: '5 min read',
  },
]
