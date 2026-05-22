import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Flight } from '@/types'

export interface PassengerFormState {
  firstName: string
  lastName: string
  contactNo: string
  passportNo: string
  nationality: string
  dob: string
}

interface FlightState {
  searchQuery: {
    origin: string
    destination: string
    date: string
    passengers: string
    cabin: string
  } | null
  selectedFlight: Flight | null
  selectedSeats: string[]
  bookingStep: 'search' | 'seat-selection' | 'passenger' | 'confirmed'
  passengerDetails: PassengerFormState[]
  
  setSearchQuery: (query: FlightState['searchQuery']) => void
  setSelectedFlight: (flight: Flight | null) => void
  setSelectedSeats: (seats: string[]) => void
  setBookingStep: (step: FlightState['bookingStep']) => void
  setPassengerDetails: (details: PassengerFormState[]) => void
  resetFlightStore: () => void
}

const DEFAULT_PASSENGER: PassengerFormState = {
  firstName: '',
  lastName: '',
  contactNo: '',
  passportNo: '',
  nationality: '',
  dob: ''
}

export const useFlightStore = create<FlightState>()(
  persist(
    (set) => ({
      searchQuery: null,
      selectedFlight: null,
      selectedSeats: [],
      bookingStep: 'search',
      passengerDetails: [DEFAULT_PASSENGER],

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedFlight: (flight) => set({ selectedFlight: flight }),
      setSelectedSeats: (seats) => set({ selectedSeats: seats }),
      setBookingStep: (step) => set({ bookingStep: step }),
      setPassengerDetails: (details) => set({ passengerDetails: details }),
      
      resetFlightStore: () => set({
        selectedFlight: null,
        selectedSeats: [],
        bookingStep: 'search',
        passengerDetails: [DEFAULT_PASSENGER]
      })
    }),
    {
      name: 'aerolux-flight-store',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeats: state.selectedSeats,
        bookingStep: state.bookingStep,
        passengerDetails: Array.isArray(state.passengerDetails) 
          ? state.passengerDetails.map(p => ({
              ...p,
              passportNo: '' // Exclude sensitive info from local storage
            }))
          : [DEFAULT_PASSENGER]
      })
    }
  )
)
