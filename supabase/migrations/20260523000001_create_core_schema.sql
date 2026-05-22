CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types for strict validation
CREATE TYPE seat_class AS ENUM ('economy', 'business', 'first');
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled', 'rescheduled');

-- 1. Flights Table
CREATE TABLE flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_no VARCHAR(20) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    departs_at TIMESTAMPTZ NOT NULL,
    arrives_at TIMESTAMPTZ NOT NULL,
    aircraft_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    base_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT departs_before_arrives CHECK (departs_at < arrives_at)
);

-- 2. Seats Table
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    class seat_class NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    extra_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(flight_id, seat_number)
);

-- 3. Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE RESTRICT,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    status booking_status NOT NULL DEFAULT 'confirmed',
    booked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_price NUMERIC(10, 2) NOT NULL,
    pnr_code VARCHAR(10) NOT NULL UNIQUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Passengers Table
CREATE TABLE passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    passport_no VARCHAR(100) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    contact_no VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Reschedules Table
CREATE TABLE reschedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    old_flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE RESTRICT,
    new_flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE RESTRICT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    fee_charged NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- Enable Supabase Realtime for the seats table
alter publication supabase_realtime add table seats;

-- Update updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_flights_updated_at
    BEFORE UPDATE ON flights
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_seats_updated_at
    BEFORE UPDATE ON seats
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
