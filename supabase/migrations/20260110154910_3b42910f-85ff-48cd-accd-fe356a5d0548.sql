-- Create call_history table for storing call records
CREATE TABLE public.call_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL,
  callee_id UUID NOT NULL,
  call_type TEXT NOT NULL DEFAULT 'video',
  status TEXT NOT NULL DEFAULT 'missed',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own call history
CREATE POLICY "Users can view their own call history"
ON public.call_history
FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Users can insert calls they initiate
CREATE POLICY "Users can insert their own calls"
ON public.call_history
FOR INSERT
WITH CHECK (auth.uid() = caller_id);

-- Users can update calls they are part of
CREATE POLICY "Users can update their own calls"
ON public.call_history
FOR UPDATE
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Create group_messages table for group chat
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT group_or_community CHECK (
    (group_id IS NOT NULL AND community_id IS NULL) OR 
    (group_id IS NULL AND community_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Members can view messages in groups they belong to
CREATE POLICY "Members can view group messages"
ON public.group_messages
FOR SELECT
USING (
  (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = group_messages.group_id 
    AND group_members.user_id = auth.uid()
  )) OR
  (community_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_members.community_id = group_messages.community_id 
    AND community_members.user_id = auth.uid()
  ))
);

-- Members can send messages to groups they belong to
CREATE POLICY "Members can send group messages"
ON public.group_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = group_messages.group_id 
      AND group_members.user_id = auth.uid()
    )) OR
    (community_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.community_members 
      WHERE community_members.community_id = group_messages.community_id 
      AND community_members.user_id = auth.uid()
    ))
  )
);

-- Enable realtime for group_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;