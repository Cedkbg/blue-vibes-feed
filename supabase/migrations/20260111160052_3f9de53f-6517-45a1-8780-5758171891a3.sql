-- Add media_url and media_type columns to group_messages for file sharing
ALTER TABLE public.group_messages
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT;