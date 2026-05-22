import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  
  const origin = params.origin as string
  const dest = params.dest as string
  const dateStr = params.date as string
  const passengerCount = parseInt((params.passengers as string) || '1')
  const cabinClass = (params.class as string) || 'economy'

  // If no params, just show a message
  if (!origin || !dest) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-24 text-center min-h-[600px]">
        <h1 className="font-headline-lg text-headline-lg mb-4">Search Flights</h1>
        <p className="text-on-surface-variant">Please use the search form on the home page.</p>
        <Link href="/" className="mt-8 text-secondary hover:underline">Return Home</Link>
      </div>
    )
  }

  // Build the query
  let query = supabase
    .from('flights')
    .select('*')
    .ilike('origin', origin)
    .ilike('destination', dest)

  if (dateStr) {
    const searchDate = new Date(dateStr)
    // For the demo, we show any flights on or after the selected date
    // rather than strictly filtering by that single exact day.
    query = query.gte('departs_at', searchDate.toISOString())
  }

  const { data: flights, error } = await query.order('departs_at', { ascending: true })

  return (
    <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-24 min-h-[800px]">
      <div className="mb-12">
        <h1 className="font-display-lg text-display-lg mb-2">Search Results</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {origin} to {dest} • {dateStr ? format(new Date(dateStr), 'MMM dd, yyyy') : 'Any Date'} • {passengerCount} Passenger(s)
        </p>
      </div>

      {error ? (
        <div className="bg-error-container text-on-error-container p-4 rounded-lg">
          Error loading flights. Please try again.
        </div>
      ) : flights?.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">flight_off</span>
          <h3 className="font-headline-lg text-headline-lg mb-2">No flights found</h3>
          <p className="text-on-surface-variant">Try adjusting your dates or routes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {flights?.map((flight) => {
            const departs = new Date(flight.departs_at)
            const arrives = new Date(flight.arrives_at)
            const durationMs = arrives.getTime() - departs.getTime()
            const durationHrs = Math.floor(durationMs / (1000 * 60 * 60))
            const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
            
            // Adjust price based on class if needed, or just show base
            const priceMultiplier = cabinClass === 'first' ? 3 : cabinClass === 'business' ? 2 : 1
            const estimatedPrice = flight.base_price * priceMultiplier * passengerCount

            return (
              <div key={flight.id} className="glass-panel p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6 hover:border-secondary/50 transition-all group">
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-surface-container-highest px-3 py-1 rounded text-xs tracking-widest text-secondary font-bold">
                      {flight.flight_no}
                    </span>
                    <span className="text-on-surface-variant text-sm">{flight.aircraft_type}</span>
                  </div>
                  <div className="flex justify-between items-center relative">
                    <div className="text-center">
                      <p className="font-display-lg text-[32px]">{format(departs, 'HH:mm')}</p>
                      <p className="text-on-surface-variant">{flight.origin}</p>
                    </div>
                    
                    <div className="flex-1 px-8 relative flex flex-col items-center justify-center">
                      <p className="text-xs text-on-surface-variant mb-1">{durationHrs}h {durationMins}m</p>
                      <div className="w-full h-[1px] bg-outline-variant relative">
                        <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-secondary bg-surface-container-high rounded-full p-1 text-[16px] group-hover:translate-x-[50px] transition-transform duration-1000">
                          flight
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 text-secondary">Direct</p>
                    </div>

                    <div className="text-center">
                      <p className="font-display-lg text-[32px]">{format(arrives, 'HH:mm')}</p>
                      <p className="text-on-surface-variant">{flight.destination}</p>
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-auto md:min-w-[200px] md:pl-6 md:border-l border-outline-variant/30 flex flex-col items-end gap-4">
                  <div className="text-right">
                    <p className="text-sm text-on-surface-variant capitalize">{cabinClass}</p>
                    <p className="font-display-lg text-[32px] text-secondary">£{estimatedPrice.toFixed(2)}</p>
                  </div>
                  <Link 
                    href={`/book/${flight.id}?class=${cabinClass}&passengers=${passengerCount}`}
                    className="w-full bg-secondary text-on-secondary px-6 py-3 rounded-lg font-label-sm text-label-sm text-center hover:bg-secondary-fixed active:scale-95 transition-all shadow-lg active-glow"
                  >
                    Select Flight
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
