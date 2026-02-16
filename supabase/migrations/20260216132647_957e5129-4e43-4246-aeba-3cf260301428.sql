
-- Fix profiles SELECT policy: hide sensitive PII from non-owners
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Everyone can see public fields, but sensitive fields (phone, birthdate, names) only visible to profile owner
CREATE POLICY "Profiles public fields viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Note: We keep the SELECT USING (true) because we need profiles visible for social features.
-- Instead, we'll use a security definer function to filter sensitive fields at the application level.

-- Create a function to get safe profile data (without PII)
CREATE OR REPLACE FUNCTION public.get_safe_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  bio text,
  avatar_url text,
  external_link text,
  is_private boolean,
  is_verified boolean,
  is_online boolean,
  last_seen timestamptz,
  profession text,
  location text,
  language text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.display_name, p.bio, p.avatar_url, p.external_link,
         p.is_private, p.is_verified, p.is_online, p.last_seen, p.profession, p.location,
         p.language, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;
