-- Create contact_groups table for organizing contacts
CREATE TABLE public.contact_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  creator_id UUID NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_group_members table
CREATE TABLE public.contact_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.contact_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group_calls table for group audio/video calls
CREATE TABLE public.group_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_group_id UUID NOT NULL REFERENCES public.contact_groups(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL,
  call_type TEXT NOT NULL DEFAULT 'video',
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create group_call_participants table
CREATE TABLE public.group_call_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.group_calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(call_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_call_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_groups
CREATE POLICY "Users can view their own groups" ON public.contact_groups
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Users can create their own groups" ON public.contact_groups
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own groups" ON public.contact_groups
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own groups" ON public.contact_groups
  FOR DELETE USING (auth.uid() = creator_id);

-- RLS policies for contact_group_members
CREATE POLICY "Group creators can view members" ON public.contact_group_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.contact_groups WHERE id = group_id AND creator_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Group creators can add members" ON public.contact_group_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.contact_groups WHERE id = group_id AND creator_id = auth.uid())
  );

CREATE POLICY "Group creators can remove members" ON public.contact_group_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.contact_groups WHERE id = group_id AND creator_id = auth.uid())
  );

-- RLS policies for group_calls
CREATE POLICY "Participants can view group calls" ON public.group_calls
  FOR SELECT USING (
    initiator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.contact_group_members 
      WHERE group_id = contact_group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can initiate calls" ON public.group_calls
  FOR INSERT WITH CHECK (
    auth.uid() = initiator_id AND
    EXISTS (
      SELECT 1 FROM public.contact_groups 
      WHERE id = contact_group_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Initiator can update calls" ON public.group_calls
  FOR UPDATE USING (initiator_id = auth.uid());

-- RLS policies for group_call_participants
CREATE POLICY "Participants can view call participants" ON public.group_call_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.group_calls gc
      WHERE gc.id = call_id AND (
        gc.initiator_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.contact_group_members WHERE group_id = gc.contact_group_id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can join calls" ON public.group_call_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON public.group_call_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Add update trigger for contact_groups
CREATE TRIGGER update_contact_groups_updated_at
  BEFORE UPDATE ON public.contact_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for group calls
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_call_participants;