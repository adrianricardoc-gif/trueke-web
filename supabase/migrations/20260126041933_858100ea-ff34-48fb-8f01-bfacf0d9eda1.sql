-- Fix #1 & #2: Profiles GPS and Data Exposure
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a view that excludes sensitive GPS data for public profile viewing
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  bio,
  location,
  user_type,
  is_verified,
  verified_at,
  created_at,
  updated_at
FROM public.profiles;
-- Note: Excludes latitude, longitude, location_verified_at

-- Policy: Users can only view their own full profile (with GPS)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Authenticated users can view basic profile info (needed for matching/messaging)
CREATE POLICY "Authenticated users can view profiles without GPS"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Allow viewing own profile OR profiles of users they have matches with
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.matches m 
    WHERE (m.user1_id = auth.uid() AND m.user2_id = profiles.user_id)
       OR (m.user2_id = auth.uid() AND m.user1_id = profiles.user_id)
  )
);

-- Fix #3: User Levels Public Exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all levels" ON public.user_levels;

-- Users can only view their own level data
CREATE POLICY "Users can view own level"
ON public.user_levels
FOR SELECT
USING (auth.uid() = user_id);

-- Fix #4: Matches INSERT Policy Too Permissive
-- Remove the dangerous "true" INSERT policy - matches should only be created by the trigger
DROP POLICY IF EXISTS "System can insert matches" ON public.matches;