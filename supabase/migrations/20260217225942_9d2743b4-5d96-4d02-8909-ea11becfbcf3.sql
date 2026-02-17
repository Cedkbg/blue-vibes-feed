
-- Fix 1: Restrict profiles SELECT to hide PII from other users
-- Drop the current permissive policy that exposes all columns
DROP POLICY IF EXISTS "Authenticated users can view other profiles" ON public.profiles;

-- Create a restrictive policy: other users can only SELECT safe columns via the view
-- Users can only see their own full profile from the base table
-- For other users' data, they must use profiles_public view or get_safe_profile function
CREATE POLICY "Users can view own full profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Grant authenticated users access to the public view
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
