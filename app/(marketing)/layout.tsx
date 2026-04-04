import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import TrackingScript from '@/components/landing/TrackingScript'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      <TrackingScript />
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}
