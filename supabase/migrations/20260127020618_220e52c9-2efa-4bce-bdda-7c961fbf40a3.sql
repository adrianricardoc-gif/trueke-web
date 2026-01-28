-- Fix Security Definer View warning by recreating with security_invoker
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
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
FROM public.profiles;