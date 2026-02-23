-- Allow public read access to profiles (sensitive fields are hidden by the profiles_public view)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.profiles;
