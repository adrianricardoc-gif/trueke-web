-- =============================================
-- FIX 1: Trade Offers - Prevent tampering after creation
-- =============================================

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Receivers can update offer status" ON public.trade_offers;
DROP POLICY IF EXISTS "Participants can update offers" ON public.trade_offers;

-- Create restrictive policy for receivers (only status changes)
CREATE POLICY "Receivers can respond to offers"
ON public.trade_offers
FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (
  auth.uid() = receiver_id AND
  status IN ('accepted', 'rejected', 'countered', 'expired')
);

-- Senders cannot modify offers after creation
CREATE POLICY "Senders cannot modify existing offers"
ON public.trade_offers
FOR UPDATE
USING (auth.uid() = sender_id AND false);

-- =============================================
-- FIX 2: Messages - Add UPDATE policy for read_at
-- =============================================

-- Add policy to allow marking messages as read
CREATE POLICY "Users can mark messages as read in their matches"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
  AND sender_id != auth.uid()  -- Can only mark others' messages as read
);

-- =============================================
-- FIX 3: Profiles - Prevent self-verification bypass
-- =============================================

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create constrained UPDATE policy that prevents admin field modification
CREATE POLICY "Users can update their own profile safely"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent modification of verification fields (admin-only)
  is_verified = (SELECT is_verified FROM profiles p WHERE p.user_id = auth.uid()) AND
  verified_at IS NOT DISTINCT FROM (SELECT verified_at FROM profiles p WHERE p.user_id = auth.uid())
);

-- =============================================
-- FIX 4: Products - Require authentication for viewing
-- =============================================

-- Drop existing public SELECT policy
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

-- Create authenticated-only SELECT policy
CREATE POLICY "Authenticated users can view products"
ON public.products
FOR SELECT
TO authenticated
USING (true);

-- =============================================
-- FIX 5: Profiles Public View - Remove location text
-- =============================================

-- Drop and recreate the view without location field
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  bio,
  user_type,
  is_verified,
  verified_at,
  created_at,
  updated_at
  -- Removed: location, latitude, longitude
FROM public.profiles;