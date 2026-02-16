
CREATE TABLE public.profile_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  visitor_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can record profile visits"
ON public.profile_visits FOR INSERT
WITH CHECK (auth.uid() = visitor_id);

CREATE POLICY "Users can see their own profile visitors"
ON public.profile_visits FOR SELECT
USING (auth.uid() = profile_id OR auth.uid() = visitor_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_visits;
