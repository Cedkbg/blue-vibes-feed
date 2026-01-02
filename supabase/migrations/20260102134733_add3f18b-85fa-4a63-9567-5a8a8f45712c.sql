-- Add is_verified column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false;

-- Create an index for faster querying of verified profiles
CREATE INDEX idx_profiles_is_verified ON public.profiles(is_verified) WHERE is_verified = true;