'use client'

interface RealtimeBadgeProps {
  count: number
}

export default function RealtimeBadge({ count }: RealtimeBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-text-secondary whitespace-nowrap">
      <span className="realtime-dot inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      <span>
        <span className="font-medium text-text-primary">{count}</span>
        <span className="hidden sm:inline">{' '}current {count === 1 ? 'visitor' : 'visitors'}</span>
      </span>
    </div>
  )
}
