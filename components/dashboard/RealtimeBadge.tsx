'use client'

interface RealtimeBadgeProps {
  count: number
}

export default function RealtimeBadge({ count }: RealtimeBadgeProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-text-secondary">
      <span className="realtime-dot inline-block w-2 h-2 rounded-full bg-emerald-500" />
      <span>
        <span className="font-medium text-text-primary">{count}</span>
        {' '}current {count === 1 ? 'visitor' : 'visitors'}
      </span>
    </div>
  )
}
