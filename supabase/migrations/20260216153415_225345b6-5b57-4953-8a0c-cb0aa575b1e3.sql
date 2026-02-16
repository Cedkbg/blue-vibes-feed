
-- Add media columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text,
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id);

-- media_type can be: 'image', 'video', 'audio', 'file', or null for text
