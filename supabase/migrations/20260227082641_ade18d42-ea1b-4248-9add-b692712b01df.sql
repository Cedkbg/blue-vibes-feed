
-- 1. Comment likes table
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comment likes viewable by everyone" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- 2. Add media_urls array to posts for carousel
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT NULL;

-- 3. Collaborative posts tables
CREATE TABLE public.collaborative_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.collaborative_post_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collab_post_id UUID NOT NULL REFERENCES public.collaborative_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'contributor',
  status TEXT NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collab_post_id, user_id)
);

ALTER TABLE public.collaborative_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborative_post_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collab posts viewable by members" ON public.collaborative_posts FOR SELECT USING (
  creator_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.collaborative_post_members 
    WHERE collab_post_id = id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can create collab posts" ON public.collaborative_posts FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update collab posts" ON public.collaborative_posts FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete collab posts" ON public.collaborative_posts FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Collab members viewable by participants" ON public.collaborative_post_members FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.collaborative_posts 
    WHERE id = collab_post_id AND creator_id = auth.uid()
  )
);
CREATE POLICY "Creators can add collab members" ON public.collaborative_post_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.collaborative_posts WHERE id = collab_post_id AND creator_id = auth.uid())
);
CREATE POLICY "Members can update their status" ON public.collaborative_post_members FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Creators can remove collab members" ON public.collaborative_post_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.collaborative_posts WHERE id = collab_post_id AND creator_id = auth.uid())
);

-- Enable realtime for comment_likes
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
