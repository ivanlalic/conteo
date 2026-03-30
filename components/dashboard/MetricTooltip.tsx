'use client'

import { useState, useRef, useEffect } from 'react'

interface MetricTooltipProps {
  text: string
}

export default function MetricTooltip({ text }: MetricTooltipProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const iconRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  function updatePosition() {
    if (!iconRef.current) return
    const rect = iconRef.current.getBoundingClientRect()
    const tooltipWidth = 280
    const padding = 8

    let left = rect.left + rect.width / 2 - tooltipWidth / 2
    // Clamp to viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding))

    let top = rect.top - 8 // place above icon
    const willOverflowTop = top - 80 < 0 // rough tooltip height
    if (willOverflowTop) {
      top = rect.bottom + 8 // place below instead
    } else {
      top = rect.top - 4
    }

    setPosition({ top, left })
  }

  function show() {
    updatePosition()
    setVisible(true)
  }

  function hide() {
    setVisible(false)
  }

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (visible) {
      hide()
    } else {
      show()
    }
  }

  // Close on outside click
  useEffect(() => {
    if (!visible) return
    function handleClick(e: MouseEvent) {
      if (
        iconRef.current &&
        !iconRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        hide()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [visible])

  return (
    <>
      <button
        ref={iconRef}
        type="button"
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-text-tertiary text-text-tertiary hover:border-text-secondary hover:text-text-secondary transition-colors ml-1 flex-shrink-0"
        style={{ fontSize: '9px', lineHeight: 1 }}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={toggle}
        aria-label="More info"
      >
        ?
      </button>

      {visible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 rounded-lg border border-border bg-bg-card shadow-md p-3"
          style={{
            top: position.top,
            left: position.left,
            width: 280,
            transform: 'translateY(-100%)',
            fontSize: 13,
            lineHeight: '1.5',
            color: 'var(--color-text-secondary)',
            pointerEvents: 'none',
          }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {text}
        </div>
      )}
    </>
  )
}
