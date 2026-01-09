-- Fix the cleanup function with proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_call_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM public.call_signals WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;