'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { randomBytes } from 'crypto'
import { PassengerFormState } from '@/store/useFlightStore'

export async function submitBooking(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to book a flight.' }
  }

  const flightId = formData.get('flightId') as string
  const seatIds = JSON.parse(formData.get('seatIds') as string) as string[]
  const passengerDetailsList = JSON.parse(formData.get('passengers') as string) as PassengerFormState[]
  const totalPrice = parseFloat(formData.get('totalPrice') as string)

  if (seatIds.length !== passengerDetailsList.length) {
    return { error: 'Mismatch between selected seats and passengers.' }
  }

  const pricePerSeat = totalPrice / seatIds.length

  // Construct JSON array for the bulk RPC
  const seatsData = seatIds.map((seatId, index) => {
    const pDetails = passengerDetailsList[index]
    return {
      seat_id: seatId,
      pnr_code: randomBytes(4).toString('hex').substring(0, 6).toUpperCase(),
      passenger_name: `${pDetails.firstName} ${pDetails.lastName}`.trim(),
      passport_no: pDetails.passportNo,
      nationality: pDetails.nationality,
      dob: pDetails.dob || null,
      contact_no: pDetails.contactNo || null
    }
  })

  // Call the bulk RPC
  const { data: bookingIds, error: rpcError } = await supabase.rpc('reserve_seats_bulk', {
    p_user_id: user.id,
    p_flight_id: flightId,
    p_total_price_per_seat: pricePerSeat,
    p_seats_data: seatsData
  })

  if (rpcError) {
    return { error: rpcError.message || 'One or more seats are no longer available.' }
  }

  const returnedIds = bookingIds as string[]
  
  // Redirect to confirmation page with comma-separated IDs
  redirect(`/book/${flightId}/confirm?booking_ids=${returnedIds.join(',')}`)
}
