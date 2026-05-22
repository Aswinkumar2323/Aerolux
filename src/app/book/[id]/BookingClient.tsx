'use client'

import { useState, useEffect, useCallback } from 'react'
import { submitBooking } from '@/app/actions/booking'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore, PassengerFormState } from '@/store/useFlightStore'
import { parseSeatsIntoRows, COLUMN_LETTERS } from '@/lib/seatUtils'
import type { SeatRow } from '@/lib/seatUtils'
import { Flight, Seat } from '@/types'

export default function BookingClient({ 
  flight, 
  seats, 
  requestedClass,
  passengerCount,
  dbPassengerDetails
}: { 
  flight: Flight
  seats: Seat[]
  requestedClass: string
  passengerCount: number
  dbPassengerDetails: {
    firstName: string
    lastName: string
    contactNo: string
    passportNo: string
    nationality: string
    dob: string
  } | null
}) {
  const supabase = createClient()
  const [localSeats, setLocalSeats] = useState<Seat[]>(seats)
  const [mounted, setMounted] = useState(false)
  const [realtimeUpdatedIds, setRealtimeUpdatedIds] = useState<Set<string>>(new Set())

  // Local state for UI toggles
  const [activeClass, setActiveClass] = useState(requestedClass)
  const [activePassengerCount, setActivePassengerCount] = useState(passengerCount)

  const {
    selectedSeats,
    setSelectedSeats,
    passengerDetails,
    setPassengerDetails,
    setSelectedFlight,
    setBookingStep,
    resetFlightStore
  } = useFlightStore()

  useEffect(() => {
    setMounted(true)
    setSelectedFlight(flight)
    setBookingStep('seat-selection')
    
    // Initialize first passenger with DB details if array is empty or default
    if (dbPassengerDetails && passengerDetails.length <= 1 && !passengerDetails[0]?.firstName) {
      setPassengerDetails([dbPassengerDetails])
    }
  }, [flight, setSelectedFlight, setBookingStep, dbPassengerDetails, setPassengerDetails])

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel(`flight-seats-${flight.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `flight_id=eq.${flight.id}`,
        },
        (payload) => {
          const updatedSeatId = payload.new.id as string

          setRealtimeUpdatedIds(prev => new Set(prev).add(updatedSeatId))
          setTimeout(() => {
            setRealtimeUpdatedIds(prev => {
              const next = new Set(prev)
              next.delete(updatedSeatId)
              return next
            })
          }, 1500)

          setLocalSeats((prev) =>
            prev.map((seat) =>
              seat.id === updatedSeatId ? { ...seat, ...payload.new } : seat
            )
          )

          if (payload.new.is_available === false) {
            setSelectedSeats(
              selectedSeats.filter(id => id !== updatedSeatId)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [flight.id, selectedSeats, setSelectedSeats, supabase])

  // Enforce passenger count limits on seat selection
  useEffect(() => {
    if (selectedSeats.length > activePassengerCount) {
      setSelectedSeats(selectedSeats.slice(0, activePassengerCount))
    }
  }, [activePassengerCount, selectedSeats, setSelectedSeats])

  // Clear seats if class changes to prevent class mismatch
  useEffect(() => {
    if (mounted) {
      const currentSelectedClass = localSeats.find(s => selectedSeats.includes(s.id))?.class
      if (currentSelectedClass && currentSelectedClass !== activeClass) {
        setSelectedSeats([])
      }
    }
  }, [activeClass]) // intentionally excluding localSeats/selectedSeats to avoid loops

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeSelectedSeats = mounted ? selectedSeats : []
  
  // Ensure we always have an array of passenger details matching the count
  const safePassengerDetails = mounted ? passengerDetails : []
  
  const updatePassengerDetail = useCallback((index: number, field: keyof PassengerFormState, value: string) => {
    const newDetails = [...safePassengerDetails]
    // Fill missing entries if expanding
    while (newDetails.length <= index) {
      newDetails.push({ firstName: '', lastName: '', contactNo: '', passportNo: '', nationality: '', dob: '' })
    }
    newDetails[index] = { ...newDetails[index], [field]: value }
    setPassengerDetails(newDetails)
  }, [safePassengerDetails, setPassengerDetails])

  const toggleSeat = (seat: Seat) => {
    if (!seat.is_available) return
    if (seat.class !== activeClass) return

    if (activeSelectedSeats.includes(seat.id)) {
      setSelectedSeats(activeSelectedSeats.filter(id => id !== seat.id))
    } else {
      if (activeSelectedSeats.length < activePassengerCount) {
        setSelectedSeats([...activeSelectedSeats, seat.id])
      }
    }
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (activeSelectedSeats.length !== activePassengerCount) {
      setError(`Please select exactly ${activePassengerCount} seat(s).`)
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('flightId', flight.id)
    formData.append('seatIds', JSON.stringify(activeSelectedSeats))
    
    // Pass the correctly sized array of passengers
    const relevantPassengers = safePassengerDetails.slice(0, activePassengerCount)
    formData.append('passengers', JSON.stringify(relevantPassengers))
    
    const selectedSeatsList = localSeats.filter(s => activeSelectedSeats.includes(s.id))
    const totalPrice = selectedSeatsList.reduce((acc, seat) => {
      const multiplier = seat.class === 'first' ? 3 : seat.class === 'business' ? 2 : 1
      return acc + (flight.base_price * multiplier) + Number(seat.extra_fee)
    }, 0)

    formData.append('totalPrice', totalPrice.toString())

    const previousSeats = [...localSeats]
    setLocalSeats((prev) =>
      prev.map((seat) =>
        activeSelectedSeats.includes(seat.id) ? { ...seat, is_available: false } : seat
      )
    )

    try {
      const result = await submitBooking(formData)
      if (result?.error) {
        setLocalSeats(previousSeats)
        setError(result.error)
        setLoading(false)
      } else {
        setBookingStep('confirmed')
        resetFlightStore()
      }
    } catch (err: unknown) {
      setLocalSeats(previousSeats)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  const sortedRows = parseSeatsIntoRows(localSeats)
  const firstClassRows = sortedRows.filter(r => r.class === 'first')
  const businessClassRows = sortedRows.filter(r => r.class === 'business')
  const economyClassRows = sortedRows.filter(r => r.class === 'economy')

  const renderCabinZone = (title: string, rows: SeatRow[], cabinClass: string) => {
    if (rows.length === 0) return null
    return (
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <span className="h-[1px] flex-1 bg-outline-variant/20"></span>
          <h3 className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold whitespace-nowrap">{title} Class</h3>
          <span className="h-[1px] flex-1 bg-outline-variant/20"></span>
        </div>

        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.rowNum} className="grid grid-cols-7 gap-2.5 items-center">
              {row.seats.map((seat, colIdx) => {
                if (colIdx === 3) {
                  return (
                    <div key={`aisle-${row.rowNum}`} className="text-center text-[10px] text-on-surface-variant/40 font-bold">
                      {row.rowNum}
                    </div>
                  )
                }

                if (!seat) {
                  return <div key={`empty-${row.rowNum}-${colIdx}`} className="h-10"></div>
                }

                const isSelected = activeSelectedSeats.includes(seat.id)
                const isTargetClass = seat.class === activeClass
                const isRealtimeFlash = realtimeUpdatedIds.has(seat.id)

                return (
                  <div key={seat.id} className="relative group">
                    <button
                      type="button"
                      disabled={!seat.is_available || !isTargetClass}
                      onClick={() => toggleSeat(seat)}
                      className={`
                        h-10 w-full rounded-t-lg rounded-b flex items-center justify-center text-xs font-bold transition-all relative
                        ${isRealtimeFlash ? 'animate-pulse ring-2 ring-amber-400/60' : ''}
                        ${!seat.is_available ? 'bg-surface-variant/20 text-on-surface-variant/40 line-through cursor-not-allowed' : ''}
                        ${seat.is_available && !isTargetClass ? 'bg-surface-container-low opacity-45 cursor-not-allowed border border-dashed border-outline-variant/30' : ''}
                        ${seat.is_available && isTargetClass && !isSelected ? 'bg-surface-container-highest hover:bg-secondary/20 hover:border-secondary border border-outline-variant text-on-surface cursor-pointer' : ''}
                        ${isSelected ? 'bg-secondary text-on-secondary shadow-[0_0_15px_rgba(var(--color-secondary),0.5)] border border-secondary' : ''}
                      `}
                    >
                      {seat.seat_number}
                    </button>

                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-surface-container-high border border-outline-variant/30 text-[10px] p-2.5 rounded-lg shadow-2xl z-50 pointer-events-none whitespace-nowrap text-on-surface">
                      <p className="font-bold uppercase tracking-wider text-secondary">{seat.seat_number}</p>
                      <p className="capitalize">Class: {seat.class}</p>
                      <p>Extra Fee: +£{seat.extra_fee}</p>
                      <p className={seat.is_available ? 'text-green-500 font-bold' : 'text-error font-bold'}>
                        {seat.is_available ? 'Available' : 'Occupied'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-12 items-start">
      {/* Seat Map */}
      <div className="flex-1 w-full glass-panel p-6 md:p-8 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg mb-2">Select Your Seats</h2>
            <p className="text-on-surface-variant text-xs">Choose a seat within your selected class zone.</p>
          </div>
          
          {/* Quick Modifier Controls */}
          <div className="flex gap-2 bg-surface-container-low p-2 rounded-lg border border-outline-variant/20">
            <select 
              value={activeClass}
              onChange={(e) => setActiveClass(e.target.value)}
              className="bg-surface-container-high border border-outline-variant/30 rounded-md px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-secondary text-on-surface capitalize"
            >
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
            <select
              value={activePassengerCount}
              onChange={(e) => setActivePassengerCount(parseInt(e.target.value))}
              className="bg-surface-container-high border border-outline-variant/30 rounded-md px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-secondary text-on-surface"
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center bg-surface-container-low/50 py-3 px-4 rounded-lg mb-8 text-[11px] border border-outline-variant/10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-surface-container-highest border border-outline-variant rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-secondary rounded shadow-[0_0_10px_rgba(var(--color-secondary),0.3)]"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-surface-variant/20 text-on-surface-variant/40 line-through rounded flex items-center justify-center font-bold text-[8px]">X</div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-surface-container-low border border-dashed border-outline-variant/30 opacity-45 rounded"></div>
            <span>Other Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded animate-pulse ring-2 ring-amber-400/60 bg-surface-container-highest"></div>
            <span>Live Update</span>
          </div>
        </div>

        {/* Seat Grid Wrap */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[420px] max-w-[500px] mx-auto">
            {/* Cockpit Indicator */}
            <div className="h-10 bg-surface-container-low rounded-t-[100px] mb-8 flex items-center justify-center border-x border-t border-outline-variant/20 relative">
              <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/50">Flight Deck</span>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-7 gap-2.5 items-center mb-3 px-2">
              {COLUMN_LETTERS.map((letter, idx) => (
                <div key={`col-header-${idx}`} className="text-center text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider">
                  {letter}
                </div>
              ))}
            </div>

            {/* Cabin Grid */}
            <div className="px-2">
              {renderCabinZone('First', firstClassRows, 'first')}
              {renderCabinZone('Business', businessClassRows, 'business')}
              {renderCabinZone('Economy', economyClassRows, 'economy')}
            </div>
          </div>
        </div>
      </div>

      {/* Passenger Form */}
      <div className="flex-1 w-full">
        <form onSubmit={handleBooking} className="glass-panel p-6 md:p-8 rounded-xl sticky top-24">
          <h2 className="font-headline-lg text-headline-lg mb-6">Passenger Details</h2>
          {error && <div className="bg-error-container text-on-error-container p-4 rounded-lg mb-6 text-sm font-semibold">{error}</div>}
          
          <div className="flex flex-col gap-8">
            {Array.from({ length: activePassengerCount }).map((_, index) => {
              const pData = safePassengerDetails[index] || { firstName: '', lastName: '', contactNo: '', passportNo: '', nationality: '', dob: '' }
              
              return (
                <div key={`passenger-${index}`} className="border border-outline-variant/20 bg-surface-container-lowest/50 p-6 rounded-xl relative">
                  <div className="absolute -top-3 left-4 bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-secondary border border-outline-variant/30">
                    Passenger {index + 1}
                  </div>
                  
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant mb-1 block uppercase tracking-wider">First Name</label>
                        <input 
                          required 
                          type="text" 
                          className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2.5 outline-none focus:border-secondary text-sm" 
                          value={pData.firstName}
                          onChange={e => updatePassengerDetail(index, 'firstName', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant mb-1 block uppercase tracking-wider">Last Name</label>
                        <input 
                          required 
                          type="text" 
                          className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2.5 outline-none focus:border-secondary text-sm" 
                          value={pData.lastName}
                          onChange={e => updatePassengerDetail(index, 'lastName', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant mb-1 block uppercase tracking-wider">Contact Number</label>
                      <input 
                        required 
                        type="tel" 
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2.5 outline-none focus:border-secondary text-sm" 
                        value={pData.contactNo}
                        onChange={e => updatePassengerDetail(index, 'contactNo', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant mb-1 block uppercase tracking-wider">Passport Number</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2.5 outline-none focus:border-secondary text-sm" 
                        value={pData.passportNo}
                        onChange={e => updatePassengerDetail(index, 'passportNo', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant mb-1 block uppercase tracking-wider">Nationality</label>
                        <input 
                          required 
                          type="text" 
                          className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2.5 outline-none focus:border-secondary text-sm" 
                          value={pData.nationality}
                          onChange={e => updatePassengerDetail(index, 'nationality', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant mb-1 block uppercase tracking-wider">Date of Birth</label>
                        <div className="flex items-center w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 h-11 outline-none focus-within:border-secondary relative">
                          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-[18px]">calendar_today</span>
                          <input 
                            required 
                            type="date" 
                            className="bg-transparent border-none w-full focus:ring-0 text-on-surface outline-none cursor-pointer relative z-20 text-sm [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-30" 
                            value={pData.dob}
                            onChange={e => updatePassengerDetail(index, 'dob', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-outline-variant/30">
            <div className="flex justify-between items-center mb-6 bg-surface-container-low p-4 rounded-lg border border-outline-variant/20">
              <span className="text-on-surface-variant font-bold text-sm">Selected Seats:</span>
              <span className={`font-black text-lg ${activeSelectedSeats.length === activePassengerCount ? 'text-green-500' : 'text-secondary'}`}>
                {activeSelectedSeats.length} / {activePassengerCount}
              </span>
            </div>
            <button 
              type="submit" 
              disabled={loading || activeSelectedSeats.length !== activePassengerCount}
              className="w-full bg-secondary text-on-secondary py-4 rounded-lg font-bold text-lg hover:bg-secondary-fixed active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Confirming...
                </>
              ) : 'Confirm & Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
