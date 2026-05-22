-- Enable Row Level Security (RLS) on all tables
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedules ENABLE ROW LEVEL SECURITY;

-- 1. Flights Policies
CREATE POLICY "Public can view flights"
ON flights FOR SELECT TO public USING (true);

-- 2. Seats Policies
CREATE POLICY "Public can view seats"
ON seats FOR SELECT TO public USING (true);

-- 3. Bookings Policies
CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
ON bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
ON bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Passengers Policies
CREATE POLICY "Users can view passengers of their bookings"
ON passengers FOR SELECT TO authenticated
USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert passengers for their bookings"
ON passengers FOR INSERT TO authenticated
WITH CHECK (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));

CREATE POLICY "Users can update passengers of their bookings"
ON passengers FOR UPDATE TO authenticated
USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()))
WITH CHECK (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));

-- 5. Reschedules Policies
CREATE POLICY "Users can view their reschedules"
ON reschedules FOR SELECT TO authenticated
USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their reschedules"
ON reschedules FOR INSERT TO authenticated
WITH CHECK (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));
