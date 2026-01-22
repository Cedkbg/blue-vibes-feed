-- 1) Drop existing triggers that use text post_id
DROP TRIGGER IF EXISTS trigger_increment_comments_count ON public.comments;
DROP TRIGGER IF EXISTS trigger_decrement_comments_count ON public.comments;

-- 2) Delete orphan comments where post_id doesn't exist in posts (before converting type)
DELETE FROM public.comments
WHERE post_id::uuid NOT IN (SELECT id FROM public.posts);

-- 3) Convert comments.post_id from text to uuid
ALTER TABLE public.comments
  ALTER COLUMN post_id TYPE uuid USING post_id::uuid;

-- 4) Add FK for integrity
ALTER TABLE public.comments
  ADD CONSTRAINT comments_post_id_fkey
  FOREIGN KEY (post_id) REFERENCES public.posts(id)
  ON DELETE CASCADE;

-- 5) Index
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);

-- 6) Recreate triggers using correct uuid type
CREATE TRIGGER trigger_increment_comments_count
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.increment_comments_count();

CREATE TRIGGER trigger_decrement_comments_count
AFTER DELETE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.decrement_comments_count();


-- 7) Sync current comments_count for all posts (populate correct values now)
UPDATE public.posts p
SET comments_count = (
  SELECT COUNT(*) FROM public.comments c WHERE c.post_id = p.id
);


-- 8) Make story view counts increase when someone views a story
CREATE OR REPLACE FUNCTION public.increment_story_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stories
  SET views_count = views_count + 1
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_increment_story_views_count ON public.story_views;
CREATE TRIGGER trigger_increment_story_views_count
AFTER INSERT ON public.story_views
FOR EACH ROW
EXECUTE FUNCTION public.increment_story_views_count();


-- 9) Allow posts to belong to a channel / group / community
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS channel_id uuid,
  ADD COLUMN IF NOT EXISTS group_id uuid,
  ADD COLUMN IF NOT EXISTS community_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_channel_id_fkey') THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_group_id_fkey') THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_community_id_fkey') THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_posts_channel_id ON public.posts(channel_id);
CREATE INDEX IF NOT EXISTS idx_posts_group_id ON public.posts(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON public.posts(community_id);