import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Demo — Conteo Dashboard',
  description: 'See Conteo analytics dashboard with real data. Free, privacy-first web analytics.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
