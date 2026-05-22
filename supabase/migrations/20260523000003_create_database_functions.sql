-- 1. Function to validate cancellation requests
CREATE OR REPLACE FUNCTION validate_booking_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    v_departs_at TIMESTAMPTZ;
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        SELECT departs_at INTO v_departs_at
        FROM flights
        WHERE id = NEW.flight_id;

        IF v_departs_at <= now() + interval '2 hours' THEN
            RAISE EXCEPTION 'Cannot cancel booking within 2 hours of departure.';
        END IF;
        
        UPDATE seats
        SET is_available = true
        WHERE id = NEW.seat_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_booking_cancellation
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE PROCEDURE validate_booking_cancellation();


-- 2. Trigger to release seat availability when a booking is deleted
CREATE OR REPLACE FUNCTION release_seat_on_booking_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE seats
    SET is_available = true
    WHERE id = OLD.seat_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_release_seat_on_booking_delete
    AFTER DELETE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION release_seat_on_booking_delete();


-- 3. Security Definer RPC function to delete the calling user's account
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC Function for Legacy Single Seat Reservation
CREATE OR REPLACE FUNCTION reserve_seat(
    p_user_id UUID,
    p_flight_id UUID,
    p_seat_id UUID,
    p_pnr_code VARCHAR(10),
    p_total_price NUMERIC,
    p_passenger_name VARCHAR(255) DEFAULT NULL,
    p_passport_no VARCHAR(100) DEFAULT NULL,
    p_nationality VARCHAR(100) DEFAULT NULL,
    p_dob DATE DEFAULT NULL,
    p_contact_no VARCHAR(100) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_is_available BOOLEAN;
    v_booking_id UUID;
BEGIN
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'User ID mismatch: you can only book for yourself.';
    END IF;

    SELECT is_available INTO v_is_available
    FROM seats
    WHERE id = p_seat_id AND flight_id = p_flight_id
    FOR UPDATE;

    IF v_is_available IS NULL THEN
        RAISE EXCEPTION 'Seat not found for the given flight.';
    END IF;

    IF NOT v_is_available THEN
        RAISE EXCEPTION 'Seat % is no longer available', p_seat_id;
    END IF;

    UPDATE seats
    SET is_available = false
    WHERE id = p_seat_id;

    INSERT INTO bookings (
        user_id, flight_id, seat_id, status, total_price, pnr_code
    ) VALUES (
        p_user_id, p_flight_id, p_seat_id, 'confirmed', p_total_price, p_pnr_code
    ) RETURNING id INTO v_booking_id;

    IF p_passenger_name IS NOT NULL THEN
        INSERT INTO passengers (
            booking_id, full_name, passport_no, nationality, dob, contact_no
        ) VALUES (
            v_booking_id, p_passenger_name, p_passport_no, p_nationality, p_dob, p_contact_no
        );
    END IF;

    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC Function for Multi-Seat Bulk Reservation
CREATE OR REPLACE FUNCTION reserve_seats_bulk(
    p_user_id UUID,
    p_flight_id UUID,
    p_total_price_per_seat NUMERIC,
    p_seats_data JSONB
) RETURNS UUID[] AS $$
DECLARE
    v_seat_record RECORD;
    v_is_available BOOLEAN;
    v_booking_id UUID;
    v_booking_ids UUID[] := '{}';
    v_seat_id UUID;
    v_pnr_code VARCHAR(10);
    v_passenger_name VARCHAR(255);
    v_passport_no VARCHAR(100);
    v_nationality VARCHAR(100);
    v_dob DATE;
    v_contact_no VARCHAR(100);
BEGIN
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'User ID mismatch: you can only book for yourself.';
    END IF;

    FOR v_seat_record IN SELECT * FROM jsonb_to_recordset(p_seats_data) AS x(
        seat_id UUID, pnr_code VARCHAR(10), passenger_name VARCHAR(255),
        passport_no VARCHAR(100), nationality VARCHAR(100), dob DATE, contact_no VARCHAR(100)
    )
    LOOP
        v_seat_id := v_seat_record.seat_id;
        v_pnr_code := v_seat_record.pnr_code;
        v_passenger_name := v_seat_record.passenger_name;
        v_passport_no := v_seat_record.passport_no;
        v_nationality := v_seat_record.nationality;
        v_dob := v_seat_record.dob;
        v_contact_no := v_seat_record.contact_no;

        SELECT is_available INTO v_is_available
        FROM seats
        WHERE id = v_seat_id AND flight_id = p_flight_id
        FOR UPDATE;

        IF v_is_available IS NULL THEN
            RAISE EXCEPTION 'Seat % not found for the given flight.', v_seat_id;
        END IF;

        IF NOT v_is_available THEN
            RAISE EXCEPTION 'Seat % is no longer available', v_seat_id;
        END IF;

        UPDATE seats
        SET is_available = false
        WHERE id = v_seat_id;

        INSERT INTO bookings (
            user_id, flight_id, seat_id, status, total_price, pnr_code
        ) VALUES (
            p_user_id, p_flight_id, v_seat_id, 'confirmed', p_total_price_per_seat, v_pnr_code
        ) RETURNING id INTO v_booking_id;

        INSERT INTO passengers (
            booking_id, full_name, passport_no, nationality, dob, contact_no
        ) VALUES (
            v_booking_id, v_passenger_name, v_passport_no, v_nationality, v_dob, v_contact_no
        );

        v_booking_ids := array_append(v_booking_ids, v_booking_id);
    END LOOP;

    RETURN v_booking_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. RPC function to cancel a booking securely
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID)
RETURNS VOID AS $$
DECLARE
    v_owner_id UUID;
BEGIN
    SELECT user_id INTO v_owner_id
    FROM bookings
    WHERE id = p_booking_id;

    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    IF v_owner_id != auth.uid() THEN
        RAISE EXCEPTION 'You do not have permission to cancel this booking.';
    END IF;

    UPDATE bookings
    SET status = 'cancelled'
    WHERE id = p_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. RPC function to reschedule a booking securely
CREATE OR REPLACE FUNCTION reschedule_booking(
    p_booking_id UUID,
    p_new_flight_id UUID,
    p_new_seat_id UUID,
    p_fee_charged DECIMAL(10,2)
)
RETURNS VOID AS $$
DECLARE   
    v_old_flight_id UUID;
    v_old_seat_id UUID;
    v_owner_id UUID;
    v_departs_at TIMESTAMPTZ;
BEGIN
    SELECT flight_id, seat_id, user_id INTO v_old_flight_id, v_old_seat_id, v_owner_id
    FROM bookings
    WHERE id = p_booking_id;

    IF v_old_flight_id IS NULL THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    IF v_owner_id != auth.uid() THEN
        RAISE EXCEPTION 'You do not have permission to reschedule this booking.';
    END IF;

    SELECT departs_at INTO v_departs_at
    FROM flights
    WHERE id = v_old_flight_id;

    IF v_departs_at <= now() + interval '2 hours' THEN
        RAISE EXCEPTION 'Cannot reschedule flight within 2 hours of departure.';
    END IF;

    IF (SELECT origin || '-' || destination FROM flights WHERE id = v_old_flight_id) !=
       (SELECT origin || '-' || destination FROM flights WHERE id = p_new_flight_id) THEN
        RAISE EXCEPTION 'Cannot reschedule to a flight on a different route.';
    END IF;

    UPDATE seats
    SET is_available = true
    WHERE id = v_old_seat_id;

    IF NOT EXISTS (
        SELECT 1 FROM seats 
        WHERE id = p_new_seat_id AND flight_id = p_new_flight_id AND is_available = true 
        FOR UPDATE
    ) THEN
        RAISE EXCEPTION 'Selected seat is no longer available.';
    END IF;

    UPDATE seats
    SET is_available = false
    WHERE id = p_new_seat_id;

    INSERT INTO reschedules (booking_id, old_flight_id, new_flight_id, fee_charged)
    VALUES (p_booking_id, v_old_flight_id, p_new_flight_id, p_fee_charged);

    UPDATE bookings
    SET flight_id = p_new_flight_id,
        seat_id = p_new_seat_id,
        status = 'rescheduled',
        total_price = total_price + p_fee_charged
    WHERE id = p_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
