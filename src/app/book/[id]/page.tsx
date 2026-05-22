import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingClient from './BookingClient'

export default async function BookFlightPage({
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

  // Fetch most recent passenger details for this user to pre-fill the form
  interface RecentPassengerQuery {
    passengers: {
      full_name: string
      passport_no: string
      nationality: string
      dob: string
      contact_no: string | null
    }[] | null
  }

  let dbPassengerDetails = null
  if (user) {
    const { data } = await supabase
      .from('bookings')
      .select(`
        passengers (
          full_name,
          passport_no,
          nationality,
          dob,
          contact_no
        )
      `)
      .eq('user_id', user.id)
      .order('booked_at', { ascending: false })
      .limit(1)

    const bookingsData = data as unknown as RecentPassengerQuery[] | null
    const recentBooking = bookingsData && bookingsData.length > 0 ? bookingsData[0] : null
    const recentPassenger = recentBooking?.passengers && recentBooking.passengers.length > 0 ? recentBooking.passengers[0] : null

    const firstName = user.user_metadata?.first_name || ''
    const lastName = user.user_metadata?.last_name || ''
    const contactNo = user.user_metadata?.contact_no || recentPassenger?.contact_no || ''

    let defaultFirstName = firstName
    let defaultLastName = lastName
    if (!defaultFirstName && recentPassenger?.full_name) {
      const parts = recentPassenger.full_name.trim().split(/\s+/)
      if (parts.length > 0) {
        defaultFirstName = parts[0]
        defaultLastName = parts.slice(1).join(' ')
      }
    }

    dbPassengerDetails = {
      firstName: defaultFirstName,
      lastName: defaultLastName,
      contactNo,
      passportNo: recentPassenger?.passport_no || '',
      nationality: recentPassenger?.nationality || '',
      dob: recentPassenger?.dob || ''
    }
  }

  const { id } = await params
  const sParams = await searchParams
  const cabinClass = (sParams.class as string) || 'economy'
  const passengerCount = parseInt((sParams.passengers as string) || '1')

  // Fetch flight details
  const { data: flight, error: flightError } = await supabase
    .from('flights')
    .select('*')
    .eq('id', id)
    .single()

  if (flightError || !flight) {
    return <div className="p-24 text-center">Flight not found.</div>
  }

  // Fetch seats for this flight
  const { data: seats, error: seatsError } = await supabase
    .from('seats')
    .select('*')
    .eq('flight_id', id)
    .order('seat_number', { ascending: true })

  if (seatsError) {
    return <div className="p-24 text-center">Error loading seats.</div>
  }

  return (
    <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-24 min-h-screen">
      <div className="mb-12">
        <h1 className="font-display-lg text-display-lg mb-2">Complete Your Booking</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Flight {flight.flight_no} • {flight.origin} to {flight.destination}
        </p>
      </div>

      <BookingClient 
        flight={flight} 
        seats={seats} 
        requestedClass={cabinClass} 
        passengerCount={passengerCount}
        dbPassengerDetails={dbPassengerDetails}
      />
    </div>
  )
}
