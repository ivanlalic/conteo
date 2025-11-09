'use client'

import { useState } from 'react'

interface InfoTooltipProps {
  text: string
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative inline-block ml-1">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-300 hover:bg-gray-400 transition cursor-help"
      >
        <span className="text-white text-[10px] font-bold">i</span>
      </div>

      {show && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg">
          <div className="relative">
            {text}
            {/* Arrow */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  )
}
