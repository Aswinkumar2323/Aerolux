'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function cancelBookingAction(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to manage bookings.' }
  }

  const { error } = await supabase.rpc('cancel_booking', {
    p_booking_id: bookingId
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/bookings')
  return { success: true }
}

export async function rescheduleBookingAction(
  bookingId: string,
  newFlightId: string,
  newSeatId: string,
  feeCharged: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to manage bookings.' }
  }

  const { error } = await supabase.rpc('reschedule_booking', {
    p_booking_id: bookingId,
    p_new_flight_id: newFlightId,
    p_new_seat_id: newSeatId,
    p_fee_charged: feeCharged
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/bookings')
  return { success: true }
}
