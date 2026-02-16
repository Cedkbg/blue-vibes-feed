
-- Trigger to enforce default values on ad creation (prevent counter manipulation)
CREATE OR REPLACE FUNCTION public.enforce_ad_defaults()
RETURNS TRIGGER AS $$
BEGIN
  NEW.views_count := 0;
  NEW.clicks_count := 0;
  IF NEW.status IS NULL OR NEW.status NOT IN ('active', 'draft') THEN
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER ensure_ad_defaults
  BEFORE INSERT ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_ad_defaults();

-- RPC function to safely increment ad clicks (prevents race conditions)
CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ads 
  SET clicks_count = clicks_count + 1 
  WHERE id = ad_id AND status = 'active';
END;
$$;

-- RPC function to safely increment ad views
CREATE OR REPLACE FUNCTION public.increment_ad_views(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ads 
  SET views_count = views_count + 1 
  WHERE id = ad_id AND status = 'active';
END;
$$;
