-- Workspaces (Créneaux) table
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  cover_url text,
  invite_code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  creator_id uuid NOT NULL,
  members_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workspace members
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspaces: members + creators can view their workspaces
CREATE POLICY "Members can view workspaces" ON public.workspaces
  FOR SELECT USING (
    creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspaces.id AND user_id = auth.uid())
  );

CREATE POLICY "Auth users can create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update workspaces" ON public.workspaces
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete workspaces" ON public.workspaces
  FOR DELETE USING (auth.uid() = creator_id);

-- Workspace members policies
CREATE POLICY "Members can view workspace members" ON public.workspace_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid())
  );

CREATE POLICY "Auth users can join workspaces" ON public.workspace_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave workspaces" ON public.workspace_members
  FOR DELETE USING (auth.uid() = user_id);

-- Function to lookup workspace by invite code (bypasses RLS)
CREATE OR REPLACE FUNCTION public.lookup_workspace_by_code(code text)
RETURNS TABLE(id uuid, name text, description text, avatar_url text, members_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT w.id, w.name, w.description, w.avatar_url, w.members_count
  FROM workspaces w
  WHERE w.invite_code = code AND w.is_active = true;
$$;