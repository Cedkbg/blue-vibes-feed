-- Create reposts table for sharing videos to feed with comments
CREATE TABLE public.reposts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Reposts are viewable by everyone" ON public.reposts FOR SELECT USING (true);
CREATE POLICY "Users can create their own reposts" ON public.reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reposts" ON public.reposts FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_reposts_user_id ON public.reposts(user_id);
CREATE INDEX idx_reposts_original_post ON public.reposts(original_post_id);