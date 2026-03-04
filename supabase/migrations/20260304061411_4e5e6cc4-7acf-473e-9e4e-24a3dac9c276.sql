
-- Sound library for TikTok-style audio browsing
CREATE TABLE public.sound_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text,
  category text NOT NULL DEFAULT 'music',
  genre text,
  duration_seconds integer,
  audio_url text NOT NULL,
  cover_url text,
  uses_count integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Anyone can browse sounds
ALTER TABLE public.sound_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sounds are viewable by everyone" ON public.sound_library FOR SELECT USING (true);

-- Only admins can manage sounds
CREATE POLICY "Admins can manage sounds" ON public.sound_library FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
