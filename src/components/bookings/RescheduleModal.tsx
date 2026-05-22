'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { rescheduleBookingAction } from '@/app/actions/bookingManagement'
import { parseSeatsIntoRows, COLUMN_LETTERS } from '@/lib/seatUtils'
import type { SeatRow } from '@/lib/seatUtils'
import { Booking, Flight, Seat } from '@/types'

interface RescheduleModalProps {
  booking: Booking
  open: boolean
  onClose: () => void
}

export default function RescheduleModal({ booking, open, onClose }: RescheduleModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const [alternativeFlights, setAlternativeFlights] = useState<Flight[]>([])
  const [fetchingFlights, setFetchingFlights] = useState(false)
  const [selectedNewFlight, setSelectedNewFlight] = useState<Flight | null>(null)

  const [availableSeats, setAvailableSeats] = useState<Seat[]>([])
  const [fetchingSeats, setFetchingSeats] = useState(false)
  const [selectedNewSeat, setSelectedNewSeat] = useState<Seat | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch alternative flights when modal opens
  useEffect(() => {
    if (!open) return
    setError(null)
    setSelectedNewFlight(null)
    setSelectedNewSeat(null)
    setFetchingFlights(true)

    const fetchFlights = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('flights')
          .select('*')
          .eq('origin', booking.flight.origin)
          .eq('destination', booking.flight.destination)
          .neq('id', booking.flight.id)
          .gt('departs_at', new Date().toISOString())
          .order('departs_at', { ascending: true })

        if (fetchError) throw fetchError
        setAlternativeFlights(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alternative flights.')
      } finally {
        setFetchingFlights(false)
      }
    }

    fetchFlights()
  }, [open, booking.flight.origin, booking.flight.destination, booking.flight.id, supabase])

  const handleSelectNewFlight = async (flight: Flight) => {
    setSelectedNewFlight(flight)
    setSelectedNewSeat(null)
    setFetchingSeats(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('seats')
        .select('*')
        .eq('flight_id', flight.id)
        .order('seat_number', { ascending: true })

      if (fetchError) throw fetchError
      setAvailableSeats(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch seats for selected flight.')
    } finally {
      setFetchingSeats(false)
    }
  }

  const handleRescheduleBooking = async () => {
    if (!selectedNewFlight || !selectedNewSeat) return
    setLoading(true)
    setError(null)

    const multiplier = booking.seat.class === 'first' ? 3 : booking.seat.class === 'business' ? 2 : 1
    const oldCost = Number(booking.flight.base_price) * multiplier
    const newCost = Number(selectedNewFlight.base_price) * multiplier
    const fee = Math.max(0, newCost - oldCost)

    try {
      const result = await rescheduleBookingAction(
        booking.id,
        selectedNewFlight.id,
        selectedNewSeat.id,
        fee
      )
      if (result?.error) {
        setError(result.error)
      } else {
        onClose()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during rescheduling.')
    } finally {
      setLoading(false)
    }
  }

  const getDisplayFee = () => {
    if (!selectedNewFlight) return 0
    const multiplier = booking.seat.class === 'first' ? 3 : booking.seat.class === 'business' ? 2 : 1
    const oldCost = Number(booking.flight.base_price) * multiplier
    const newCost = Number(selectedNewFlight.base_price) * multiplier
    return Math.max(0, newCost - oldCost)
  }

  const parsedSeatRows = parseSeatsIntoRows(availableSeats)

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface-container border border-outline-variant/20 max-w-2xl w-full p-6 md:p-8 rounded-2xl shadow-2xl relative my-8">
        <h3 className="font-headline-lg text-headline-lg mb-2 font-bold flex items-center gap-2 text-secondary">
          <span className="material-symbols-outlined">schedule</span> Reschedule Booking
        </h3>
        <p className="text-on-surface-variant text-xs mb-6">
          Pick an alternative flight and seat for <span className="font-bold">{booking.flight.origin} → {booking.flight.destination}</span>. A fee applies if the new flight is more expensive.
        </p>

        {error && (
          <div className="bg-error-container text-on-error-container text-xs p-4 rounded-lg mb-6 border border-error/30 font-semibold">
            {error}
          </div>
        )}

        {/* Flight Selector */}
        <div className="mb-6">
          <h4 className="font-bold text-xs uppercase text-on-surface-variant tracking-wider mb-2">1. Select Alternative Flight</h4>
          {fetchingFlights ? (
            <div className="py-6 text-center text-xs text-on-surface-variant">Searching for alternative flights...</div>
          ) : alternativeFlights.length === 0 ? (
            <div className="py-6 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-lg">
              No other flights found on this route departing after today.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
              {alternativeFlights.map((flight) => {
                const isSelected = selectedNewFlight?.id === flight.id
                return (
                  <button
                    key={flight.id}
                    type="button"
                    onClick={() => handleSelectNewFlight(flight)}
                    className={`p-3 rounded-lg border text-left flex justify-between items-center transition-all text-xs
                      ${isSelected
                        ? 'bg-secondary/10 border-secondary text-on-surface font-semibold'
                        : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'}`}
                  >
                    <div>
                      <span className="font-bold">{flight.flight_no}</span>
                      <span className="mx-2">|</span>
                      <span>{new Date(flight.departs_at).toLocaleDateString()} at {new Date(flight.departs_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className="font-bold text-secondary">
                      Base: £{flight.base_price}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Seat Selector */}
        {selectedNewFlight && (
          <div className="mb-6 border-t border-outline-variant/10 pt-6">
            <h4 className="font-bold text-xs uppercase text-on-surface-variant tracking-wider mb-3">
              2. Select Seat (Enforced: {booking.seat.class} Class)
            </h4>
            {fetchingSeats ? (
              <div className="py-6 text-center text-xs text-on-surface-variant">Loading cabin seating plan...</div>
            ) : (
              <div className="overflow-x-auto max-h-[220px] overflow-y-auto border border-outline-variant/15 p-4 rounded-xl bg-surface-container-low">
                <div className="min-w-[420px] flex flex-col gap-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-7 gap-1.5 items-center mb-1">
                    {COLUMN_LETTERS.map((letter, idx) => (
                      <div key={`header-${idx}`} className="text-center text-[9px] font-bold text-on-surface-variant/50 uppercase">
                        {letter}
                      </div>
                    ))}
                  </div>

                  {parsedSeatRows.map((row: SeatRow) => (
                    <div key={row.rowNum} className="grid grid-cols-7 gap-1.5 items-center">
                      {row.seats.map((seat: Seat | null, colIdx: number) => {
                        if (colIdx === 3) {
                          return <div key={`aisle-${row.rowNum}`} className="text-center text-[9px] font-bold opacity-30">{row.rowNum}</div>
                        }

                        if (!seat) return <div key={`empty-${row.rowNum}-${colIdx}`} className="h-8"></div>

                        const isCorrectClass = seat.class === booking.seat.class
                        const isSelected = selectedNewSeat?.id === seat.id
                        const isAvailable = seat.is_available

                        return (
                          <button
                            key={seat.id}
                            type="button"
                            disabled={!isAvailable || !isCorrectClass}
                            onClick={() => setSelectedNewSeat(seat)}
                            className={`h-8 w-full rounded text-[10px] font-bold transition-all
                              ${!isAvailable ? 'bg-surface-variant/20 text-on-surface-variant/30 line-through cursor-not-allowed' : ''}
                              ${isAvailable && !isCorrectClass ? 'bg-surface-container-high opacity-30 cursor-not-allowed border border-dashed' : ''}
                              ${isAvailable && isCorrectClass && !isSelected ? 'bg-surface-container-highest border border-outline-variant hover:bg-secondary/10 hover:border-secondary' : ''}
                              ${isSelected ? 'bg-secondary text-on-secondary shadow-lg' : ''}`}
                          >
                            {seat.seat_number}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirm Actions */}
        <div className="border-t border-outline-variant/10 pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-xs">
            {selectedNewFlight && selectedNewSeat ? (
              <div>
                <p className="text-on-surface font-semibold">Rescheduling Summary:</p>
                <p className="text-on-surface-variant">New Flight: <span className="text-on-surface font-bold">{selectedNewFlight.flight_no}</span></p>
                <p className="text-on-surface-variant">New Seat: <span className="text-on-surface font-bold">{selectedNewSeat.seat_number}</span></p>
                <p className="text-on-surface-variant">Reschedule Fee: <span className="text-secondary font-bold">£{getDisplayFee()}</span></p>
              </div>
            ) : (
              <p className="text-on-surface-variant">Please choose a flight and a matching class seat to proceed.</p>
            )}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 md:flex-none py-2.5 px-5 bg-surface-container-high hover:bg-surface-variant rounded-lg font-bold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !selectedNewFlight || !selectedNewSeat}
              onClick={handleRescheduleBooking}
              className="flex-1 md:flex-none py-2.5 px-6 bg-secondary text-on-secondary hover:bg-secondary-fixed rounded-lg font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Confirm Reschedule'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
