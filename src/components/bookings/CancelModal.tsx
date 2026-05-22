'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cancelBookingAction } from '@/app/actions/bookingManagement'
import { useFlightStore } from '@/store/useFlightStore'
import { Booking } from '@/types'

interface CancelModalProps {
  booking: Booking
  open: boolean
  onClose: () => void
}

export default function CancelModal({ booking, open, onClose }: CancelModalProps) {
  const { resetFlightStore } = useFlightStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCancelBooking = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await cancelBookingAction(booking.id)
      if (result?.error) {
        setError(result.error)
      } else {
        resetFlightStore()
        onClose()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during cancellation.')
    } finally {
      setLoading(false)
    }
  }

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-container border border-outline-variant/20 max-w-md w-full p-8 rounded-2xl shadow-2xl relative">
        <h3 className="font-headline-lg text-headline-lg mb-4 text-error font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span> Confirm Cancellation
        </h3>
        <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
          Are you sure you want to cancel your flight from <span className="font-bold text-on-surface">{booking.flight.origin}</span> to <span className="font-bold text-on-surface">{booking.flight.destination}</span>?
          <br /><br />
          This action is destructive, frees your seat immediately, and cannot be undone. Cancellations within 2 hours of departure are strictly prohibited.
        </p>

        {error && (
          <div className="bg-error-container text-on-error-container text-xs p-4 rounded-lg mb-6 border border-error/30 font-semibold">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            disabled={loading}
            onClick={onClose}
            className="flex-1 py-3 bg-surface-container-high hover:bg-surface-variant rounded-lg font-bold text-sm transition-all"
          >
            Back
          </button>
          <button
            disabled={loading}
            onClick={handleCancelBooking}
            className="flex-1 py-3 bg-error text-on-error hover:bg-red-600 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Cancelling...' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
