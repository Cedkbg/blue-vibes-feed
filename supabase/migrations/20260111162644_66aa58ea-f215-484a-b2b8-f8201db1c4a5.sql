-- Add reply_to column for message replies
ALTER TABLE public.group_messages 
ADD COLUMN reply_to_id UUID REFERENCES public.group_messages(id) ON DELETE SET NULL;

-- Create table for push notification tokens
CREATE TABLE public.push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for push_tokens
CREATE POLICY "Users can view their own push tokens" 
ON public.push_tokens FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens" 
ON public.push_tokens FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens" 
ON public.push_tokens FOR DELETE 
USING (auth.uid() = user_id);

-- Add policy for deleting own messages
CREATE POLICY "Users can delete their own group messages" 
ON public.group_messages FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster reply lookups
CREATE INDEX idx_group_messages_reply_to ON public.group_messages(reply_to_id);