
-- Prevent self-follows
ALTER TABLE public.follows ADD CONSTRAINT no_self_follow CHECK (follower_id != following_id);

-- Create function to auto-verify first 1000 users
CREATE OR REPLACE FUNCTION public.auto_verify_first_1000()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_count integer;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.profiles;
  IF total_count <= 1000 THEN
    UPDATE public.profiles SET is_verified = true WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on profile creation
CREATE TRIGGER auto_verify_on_signup
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_verify_first_1000();
