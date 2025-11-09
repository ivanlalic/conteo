'use client'

import { useEffect } from 'react'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  planName: 'Pro' | 'Business'
}

export default function PricingModal({ isOpen, onClose, planName }: PricingModalProps) {
  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          aria-label="Cerrar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">🚀</span>
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Gracias por tu interés en {planName}!
          </h3>
          <p className="text-gray-600 mb-6">
            Estamos trabajando en este plan para lanzarlo pronto. Mientras tanto,
            puedes comenzar <span className="font-semibold text-indigo-600">gratis</span> con
            nuestro plan Free y te notificaremos cuando {planName} esté disponible.
          </p>

          {/* Features preview */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              El plan {planName} incluirá:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              {planName === 'Pro' && (
                <>
                  <li>✓ 3 sitios web</li>
                  <li>✓ 50k eventos/mes</li>
                  <li>✓ Soporte prioritario</li>
                </>
              )}
              {planName === 'Business' && (
                <>
                  <li>✓ 10 sitios web</li>
                  <li>✓ 100k eventos/mes</li>
                  <li>✓ API access</li>
                </>
              )}
            </ul>
          </div>

          {/* CTA Button */}
          <a
            href="/signup"
            className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition text-center"
          >
            Comenzar con Free
          </a>

          <p className="text-xs text-gray-500 mt-4">
            Sin tarjeta de crédito · Gratis para siempre
          </p>
        </div>
      </div>
    </div>
  )
}
