'use client'

import { useState, useRef, useEffect } from 'react'

interface InfoTooltipProps {
  text: string
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.top - 10, // 10px above the icon
        left: rect.left + rect.width / 2, // center horizontally
      })
    }
  }, [show])

  return (
    <div className="relative inline-block ml-1">
      <div
        ref={triggerRef}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-300 hover:bg-gray-400 transition cursor-help"
      >
        <span className="text-white text-[10px] font-bold">i</span>
      </div>

      {show && (
        <div
          className="fixed z-[9999] w-64 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="relative">
            {text}
            {/* Arrow */}
            <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  )
}
