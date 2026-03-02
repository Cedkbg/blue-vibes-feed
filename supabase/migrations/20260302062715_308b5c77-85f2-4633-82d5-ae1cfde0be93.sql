
-- Fix collaborative_posts SELECT RLS policy bug (was referencing collaborative_post_members.id instead of collaborative_posts.id)
DROP POLICY IF EXISTS "Collab posts viewable by members" ON public.collaborative_posts;
CREATE POLICY "Collab posts viewable by members" ON public.collaborative_posts
  FOR SELECT USING (
    creator_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM collaborative_post_members 
      WHERE collaborative_post_members.collab_post_id = collaborative_posts.id 
      AND collaborative_post_members.user_id = auth.uid()
    )
  );

-- Add mood_aura column for the unique Mood Aura feature
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS mood_aura text DEFAULT NULL;
