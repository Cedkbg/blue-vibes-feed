
-- Remove the dangerous policy that exposes all profiles to any authenticated user
DROP POLICY IF EXISTS "Authenticated users can view other profiles" ON public.profiles;

-- Remove duplicates
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Ensure only the correct restrictive policy remains
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.profiles;

CREATE POLICY "Users can view their own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);
