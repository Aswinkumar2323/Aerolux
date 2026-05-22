-- Seed Test User
-- Email: aswinak0330@gmail.com
-- Password: 123456
DO $$
DECLARE
  v_user_id UUID := 'b83a00a4-7935-430c-99d9-69bd52531a7c';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'aswinak0330@gmail.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'aswinak0330@gmail.com', crypt('123456', gen_salt('bf')), now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"first_name": "Aswin", "last_name": "Kumar"}', now(), now()
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id, 'aswinak0330@gmail.com')::jsonb,
      'email', now(), now(), now()
    );
  END IF;
END $$;


-- Seed Data for Flights and Seats
DO $$
DECLARE
    v_flight_id UUID;
    v_base_date TIMESTAMPTZ := date_trunc('day', now()) + interval '7 days';
    
    v_routes JSONB := '[
        {"origin": "LHR", "dest": "JFK", "dur": "8 hours", "price": 450.00, "craft": "Boeing 787"},
        {"origin": "JFK", "dest": "LHR", "dur": "7 hours", "price": 420.00, "craft": "Boeing 787"},
        {"origin": "HND", "dest": "SIN", "dur": "7 hours", "price": 899.00, "craft": "Airbus A350"},
        {"origin": "SIN", "dest": "HND", "dur": "6.5 hours", "price": 850.00, "craft": "Airbus A350"},
        {"origin": "DXB", "dest": "CDG", "dur": "7 hours", "price": 550.00, "craft": "Boeing 777"},
        {"origin": "CDG", "dest": "DXB", "dur": "6.5 hours", "price": 530.00, "craft": "Boeing 777"},
        {"origin": "SYD", "dest": "LAX", "dur": "14 hours", "price": 1200.00, "craft": "Airbus A380"},
        {"origin": "LAX", "dest": "SYD", "dur": "15 hours", "price": 1150.00, "craft": "Airbus A380"}
    ]'::JSONB;
    
    v_route JSONB;
    v_index INT := 1;
    v_row INT;
    v_col TEXT;
    v_fee NUMERIC;
BEGIN
    FOR v_route IN SELECT * FROM jsonb_array_elements(v_routes)
    LOOP
        -- Generate 3 alternative flights for each route (spaced out by a day)
        FOR v_day_offset IN 0..2 LOOP
            INSERT INTO flights (
                flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price
            ) VALUES (
                'AL' || lpad(v_index::TEXT, 3, '0'),
                v_route->>'origin',
                v_route->>'dest',
                v_base_date + (v_day_offset || ' days')::interval + (v_index || ' hours')::interval,
                v_base_date + (v_day_offset || ' days')::interval + (v_index || ' hours')::interval + (v_route->>'dur')::interval,
                v_route->>'craft',
                (v_route->>'price')::NUMERIC + (v_day_offset * 15.00) -- slight price variation
            ) RETURNING id INTO v_flight_id;
            
            -- First Class (A, E)
            FOR v_row IN 1..2 LOOP
                FOREACH v_col IN ARRAY ARRAY['A', 'E'] LOOP
                    INSERT INTO seats (flight_id, seat_number, class, extra_fee)
                    VALUES (v_flight_id, v_row::TEXT || v_col, 'first', 1500.00);
                END LOOP;
            END LOOP;

            -- Business Class (A, C, D, F)
            FOR v_row IN 3..7 LOOP
                FOREACH v_col IN ARRAY ARRAY['A', 'C', 'D', 'F'] LOOP
                    INSERT INTO seats (flight_id, seat_number, class, extra_fee)
                    VALUES (v_flight_id, v_row::TEXT || v_col, 'business', 500.00);
                END LOOP;
            END LOOP;

            -- Economy Class (A, B, C, D, E, F)
            FOR v_row IN 8..30 LOOP
                FOREACH v_col IN ARRAY ARRAY['A', 'B', 'C', 'D', 'E', 'F'] LOOP
                    IF v_row = 15 THEN
                        v_fee := 50.00;
                    ELSIF v_col IN ('A', 'F') THEN
                        v_fee := 20.00;
                    ELSE
                        v_fee := 0.00;
                    END IF;

                    INSERT INTO seats (flight_id, seat_number, class, extra_fee)
                    VALUES (v_flight_id, v_row::TEXT || v_col, 'economy', v_fee);
                END LOOP;
            END LOOP;

            v_index := v_index + 1;
        END LOOP;
    END LOOP;
END $$;
