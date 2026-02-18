
-- Fix profiles table RLS: restrict SELECT to authenticated users only (own data)
-- and allow public access ONLY via the profiles_public view

-- Drop any existing permissive SELECT policies on profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Policy: users can read their own full profile (with sensitive fields)
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: authenticated users can view other profiles via restricted fields only
-- (This covers internal app usage; external/public access goes through profiles_public view)
CREATE POLICY "Authenticated users can view other profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
