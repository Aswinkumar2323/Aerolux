export interface Flight {
  id: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  aircraft_type: string
  status: string
  base_price: number
  created_at?: string
  updated_at?: string
}

export interface Seat {
  id: string
  flight_id: string
  seat_number: string
  class: 'first' | 'business' | 'economy'
  is_available: boolean
  extra_fee: number
  created_at?: string
  updated_at?: string
}

export interface Passenger {
  full_name: string
  passport_no: string
  nationality: string
  dob: string
}

export interface Booking {
  id: string
  user_id: string
  flight_id: string
  seat_id: string
  status: 'confirmed' | 'rescheduled' | 'cancelled'
  booked_at: string
  total_price: number
  pnr_code: string
  flight: Flight
  seat: Seat
  passengers?: Passenger[]
}
