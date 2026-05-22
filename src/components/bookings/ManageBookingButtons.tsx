'use client'

import { useState } from 'react'
import CancelModal from './CancelModal'
import RescheduleModal from './RescheduleModal'
import { Booking } from '@/types'

export default function ManageBookingButtons({ booking }: { booking: Booking }) {
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)

  const isCancelled = booking.status === 'cancelled'
  const departsAt = booking.flight?.departs_at ? new Date(booking.flight.departs_at).getTime() : 0
  const isWithinTwoHours = departsAt <= Date.now() + 2 * 60 * 60 * 1000

  if (isCancelled) {
    return <span className="text-xs text-on-surface-variant italic font-semibold">No Actions Available</span>
  }

  if (isWithinTwoHours) {
    return <span className="text-xs text-on-surface-variant/70 italic font-semibold">Non-modifiable (within 2h of departure)</span>
  }

  return (
    <div className="flex flex-row lg:flex-col gap-2 w-full">
      <button
        onClick={() => setRescheduleModalOpen(true)}
        className="flex-1 py-2 px-4 bg-surface-container-high border border-outline-variant/30 text-on-surface hover:bg-surface-variant font-bold text-xs rounded-lg active:scale-95 transition-all text-center"
      >
        Reschedule
      </button>
      <button
        onClick={() => setCancellationModalOpen(true)}
        className="flex-1 py-2 px-4 bg-error-container/20 border border-error/20 text-error hover:bg-error/10 font-bold text-xs rounded-lg active:scale-95 transition-all text-center"
      >
        Cancel Booking
      </button>

      <CancelModal
        booking={booking}
        open={cancellationModalOpen}
        onClose={() => setCancellationModalOpen(false)}
      />

      <RescheduleModal
        booking={booking}
        open={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
      />
    </div>
  )
}
