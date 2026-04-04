'use client'

interface CTAButtonProps {
  href: string
  trackLabel: string
  children: React.ReactNode
  className?: string
}

export default function CTAButton({ href, trackLabel, children, className }: CTAButtonProps) {
  function handleClick() {
    if (typeof window !== 'undefined' && (window as any).conteo) {
      (window as any).conteo.trackEvent('CTA Click', { props: { location: trackLabel } })
    }
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
