-- 1. ADD OWNER_ID COLUMN
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- 2. ENABLE RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 3. DROP OLD POLICIES (Safety)
DROP POLICY IF EXISTS "Public read" ON businesses;
DROP POLICY IF EXISTS "Auth insert" ON businesses;
DROP POLICY IF EXISTS "Owner manage" ON businesses;
DROP POLICY IF EXISTS "Public read" ON services;
DROP POLICY IF EXISTS "Owner manage" ON services;
DROP POLICY IF EXISTS "Public read" ON business_hours;
DROP POLICY IF EXISTS "Owner manage" ON business_hours;
DROP POLICY IF EXISTS "Public read" ON bookings;
DROP POLICY IF EXISTS "Public insert" ON bookings;
DROP POLICY IF EXISTS "Owner manage" ON bookings;

-- 4. BUSINESSES POLICIES
CREATE POLICY "Anyone can view businesses" 
ON businesses FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create businesses" 
ON businesses FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their businesses" 
ON businesses FOR UPDATE 
TO authenticated 
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their businesses" 
ON businesses FOR DELETE 
TO authenticated 
USING (auth.uid() = owner_id);


-- 5. SERVICES POLICIES
CREATE POLICY "Anyone can view services" 
ON services FOR SELECT 
USING (true);

CREATE POLICY "Owners can manage services" 
ON services FOR ALL 
TO authenticated 
USING (
  auth.uid() = (SELECT owner_id FROM businesses WHERE id = business_id)
)
WITH CHECK (
  auth.uid() = (SELECT owner_id FROM businesses WHERE id = business_id)
);


-- 6. BUSINESS HOURS POLICIES
CREATE POLICY "Anyone can view hours" 
ON business_hours FOR SELECT 
USING (true);

CREATE POLICY "Owners can manage hours" 
ON business_hours FOR ALL 
TO authenticated 
USING (
  auth.uid() = (SELECT owner_id FROM businesses WHERE id = business_id)
)
WITH CHECK (
  auth.uid() = (SELECT owner_id FROM businesses WHERE id = business_id)
);


-- 7. BOOKINGS POLICIES
CREATE POLICY "Anyone can view bookings" 
ON bookings FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create bookings" 
ON bookings FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Owners can manage bookings" 
ON bookings FOR ALL 
TO authenticated 
USING (
  auth.uid() = (SELECT owner_id FROM businesses WHERE id = business_id)
)
WITH CHECK (
  auth.uid() = (SELECT owner_id FROM businesses WHERE id = business_id)
);
