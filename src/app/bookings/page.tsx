import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'
import ManageBookingButtons from '@/components/bookings/ManageBookingButtons'
import { Booking } from '@/types'

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: bookingsData, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      booked_at,
      total_price,
      pnr_code,
      flight:flights (
        id,
        flight_no,
        origin,
        destination,
        departs_at,
        arrives_at,
        base_price
      ),
      seat:seats (
        id,
        seat_number,
        class,
        extra_fee
      ),
      passengers (
        full_name,
        passport_no,
        nationality,
        dob
      )
    `)
    .eq('user_id', user.id)
    .order('booked_at', { ascending: false })

  const bookings = bookingsData as Booking[] | null

  if (error) {
    console.error('Error fetching bookings:', error)
  }

  return (
    <div className="min-h-screen bg-background text-on-background pb-12">
      <Navbar />

      <main className="w-full px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto pt-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="font-headline-xl text-headline-xl mb-2 font-bold tracking-tight">My Bookings</h1>
            <p className="text-on-surface-variant">Manage your reservations, check seat assignments, and reschedule or cancel flights.</p>
          </div>
          <Link 
            href="/"
            className="bg-secondary text-on-secondary px-6 py-3 rounded-lg font-bold hover:bg-secondary-fixed active:scale-95 transition-all text-sm"
          >
            Book New Flight
          </Link>
        </div>

        {bookings && bookings.length > 0 ? (
          <div className="flex flex-col gap-6">
            {bookings.map((booking: Booking) => {
              const passenger = booking.passengers?.[0]
              const statusColors = {
                confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                rescheduled: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }[booking.status as 'confirmed' | 'rescheduled' | 'cancelled'] || 'bg-surface-variant text-on-surface-variant'

              return (
                <div 
                  key={booking.id}
                  className="glass-panel p-6 md:p-8 rounded-2xl flex flex-col lg:flex-row justify-between gap-8 border border-outline-variant/10 relative overflow-hidden"
                >
                  {/* Decorative PNR watermark */}
                  <div className="absolute right-4 bottom-4 text-9xl font-bold opacity-[0.02] pointer-events-none select-none">
                    {booking.pnr_code}
                  </div>

                  <div className="flex-1 flex flex-col md:flex-row gap-8 items-start md:items-center">
                    {/* Status Badge & Route Overview */}
                    <div className="min-w-[200px]">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColors}`}>
                          {booking.status}
                        </span>
                        <span className="text-xs text-on-surface-variant font-mono">PNR: {booking.pnr_code}</span>
                      </div>
                      
                      <div className="text-2xl font-bold tracking-tight mb-1 text-on-surface flex items-center gap-2">
                        <span>{booking.flight.origin}</span>
                        <span className="material-symbols-outlined text-secondary text-sm">arrow_forward</span>
                        <span>{booking.flight.destination}</span>
                      </div>
                      <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{booking.flight.flight_no}</div>
                    </div>

                    {/* Timeline Info */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-t md:border-t-0 md:border-l border-outline-variant/20 pt-4 md:pt-0 md:pl-8">
                      <div>
                        <span className="text-[10px] uppercase text-on-surface-variant font-bold block mb-1">Departure</span>
                        <span className="text-sm font-semibold">
                          {new Date(booking.flight.departs_at).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="text-xs text-on-surface-variant block mt-0.5">
                          {new Date(booking.flight.departs_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-on-surface-variant font-bold block mb-1">Arrival</span>
                        <span className="text-sm font-semibold">
                          {new Date(booking.flight.arrives_at).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="text-xs text-on-surface-variant block mt-0.5">
                          {new Date(booking.flight.arrives_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Passenger & Ticket Info */}
                    <div className="border-t md:border-t-0 md:border-l border-outline-variant/20 pt-4 md:pt-0 md:pl-8 flex flex-col gap-2">
                      <div>
                        <span className="text-[10px] uppercase text-on-surface-variant font-bold block">Passenger</span>
                        <span className="text-sm font-bold text-on-surface">{passenger?.full_name || 'N/A'}</span>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-[10px] uppercase text-on-surface-variant font-bold block">Seat</span>
                          <span className="text-xs font-mono font-bold bg-surface-container px-2 py-0.5 rounded text-secondary border border-outline-variant/20">
                            {booking.seat.seat_number} ({booking.seat.class})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-on-surface-variant font-bold block">Price Paid</span>
                          <span className="text-xs font-bold text-on-surface">£{booking.total_price}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Cancel / Reschedule Buttons) */}
                  <div className="flex items-center justify-end border-t lg:border-t-0 lg:border-l border-outline-variant/20 pt-4 lg:pt-0 lg:pl-8 min-w-[200px]">
                    <ManageBookingButtons booking={booking} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="glass-panel p-12 text-center rounded-2xl border border-outline-variant/10">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4 block">flight_takeoff</span>
            <h3 className="text-lg font-bold mb-2">No Bookings Found</h3>
            <p className="text-on-surface-variant mb-6 max-w-md mx-auto">You don't have any flight bookings registered to your account yet. Let's find your next destination!</p>
            <Link 
              href="/"
              className="bg-secondary text-on-secondary px-6 py-3 rounded-lg font-bold hover:bg-secondary-fixed active:scale-95 transition-all text-sm inline-block"
            >
              Search Flights
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
