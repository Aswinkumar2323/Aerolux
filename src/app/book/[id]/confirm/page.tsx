import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  
  // Verify Authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { id: flightId } = await params
  const sParams = await searchParams
  
  // Support both single booking_id and comma-separated booking_ids
  const bookingIdParam = sParams.booking_id as string
  const bookingIdsParam = sParams.booking_ids as string
  
  let bookingIds: string[] = []
  if (bookingIdsParam) {
    bookingIds = bookingIdsParam.split(',')
  } else if (bookingIdParam) {
    bookingIds = [bookingIdParam]
  }

  if (bookingIds.length === 0) {
    redirect('/')
  }

  // Fetch Booking Details
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      *,
      flights (*),
      seats (*),
      passengers (*)
    `)
    .in('id', bookingIds)

  if (bookingsError || !bookings || bookings.length === 0) {
    return <div className="p-24 text-center text-error">Bookings not found or you don't have permission to view them.</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-24 min-h-screen">
      <div className="text-center mb-12">
        <span className="material-symbols-outlined text-[64px] text-secondary mb-4 block">check_circle</span>
        <h1 className="font-display-lg text-display-lg mb-2">Booking Confirmed!</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Thank you. Your {bookings.length > 1 ? 'reservations are' : 'reservation is'} secured.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {bookings.map((booking) => {
          const passenger = booking.passengers?.[0]
          const flight = booking.flights
          const seat = booking.seats

          return (
            <div key={booking.id} className="glass-panel p-8 md:p-12 rounded-xl relative overflow-hidden shadow-lg border border-outline-variant/20">
              {/* Boarding Pass Style Detail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-outline-variant/30 pb-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-secondary mb-1">Passenger</p>
                  <p className="font-display-sm text-[24px] font-bold">{passenger?.full_name}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-[10px] uppercase tracking-widest text-secondary mb-1">PNR Code</p>
                  <p className="font-display-sm text-[24px] tracking-widest text-secondary">{booking.pnr_code}</p>
                </div>
              </div>

              <div className="bg-surface-container-low p-6 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-secondary mb-1">Flight</p>
                  <p className="font-bold">{flight.flight_no}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-secondary mb-1">Date</p>
                  <p className="font-bold">{format(new Date(flight.departs_at), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-secondary mb-1">Seat</p>
                  <p className="font-bold">{seat.seat_number}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-secondary mb-1">Class</p>
                  <p className="font-bold capitalize">{seat.class}</p>
                </div>
              </div>

              <div className="flex justify-between items-center bg-surface-container-lowest p-6 rounded-lg border border-outline-variant/10">
                <div className="text-center">
                  <p className="font-display-lg text-[32px]">{format(new Date(flight.departs_at), 'HH:mm')}</p>
                  <p className="text-on-surface-variant font-bold">{flight.origin}</p>
                </div>
                <div className="flex-1 px-8 relative flex flex-col items-center justify-center">
                  <div className="w-full h-[2px] bg-secondary border-dashed border-t-2 relative">
                    <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-secondary bg-surface-container-lowest p-2">
                      flight_takeoff
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-display-lg text-[32px]">{format(new Date(flight.arrives_at), 'HH:mm')}</p>
                  <p className="text-on-surface-variant font-bold">{flight.destination}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="mt-12 flex justify-center gap-4">
        <Link href="/" className="bg-surface-container-highest px-8 py-3 rounded-lg font-bold hover:bg-surface-variant transition-all text-on-surface">
          Return Home
        </Link>
      </div>
    </div>
  )
}
