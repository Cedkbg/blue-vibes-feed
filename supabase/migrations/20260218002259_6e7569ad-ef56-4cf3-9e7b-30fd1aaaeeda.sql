
-- Table pour les demandes d'abonnement (comptes privés)
CREATE TABLE public.follow_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  target_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, target_id)
);

ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create follow requests"
ON public.follow_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can view their own requests"
ON public.follow_requests FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Target users can update requests"
ON public.follow_requests FOR UPDATE
USING (auth.uid() = target_id);

CREATE POLICY "Users can delete their own requests"
ON public.follow_requests FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Table pour les hashtags
CREATE TABLE public.hashtags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hashtags are viewable by everyone"
ON public.hashtags FOR SELECT USING (true);

-- Table de liaison post-hashtag
CREATE TABLE public.post_hashtags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, hashtag_id)
);

ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post hashtags are viewable by everyone"
ON public.post_hashtags FOR SELECT USING (true);

CREATE POLICY "Users can tag their posts"
ON public.post_hashtags FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid()));

CREATE POLICY "Users can untag their posts"
ON public.post_hashtags FOR DELETE
USING (EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid()));

-- Fonction pour extraire et indexer les hashtags d'un post
CREATE OR REPLACE FUNCTION public.extract_hashtags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tag TEXT;
  tag_id UUID;
  tags TEXT[];
BEGIN
  -- Extraire les hashtags du caption
  IF NEW.caption IS NOT NULL THEN
    SELECT ARRAY(
      SELECT DISTINCT lower(m[1])
      FROM regexp_matches(NEW.caption, '#([a-zA-Z0-9_\u00C0-\u024F]+)', 'g') AS m
    ) INTO tags;
    
    -- Supprimer les anciens hashtags si c'est un UPDATE
    IF TG_OP = 'UPDATE' THEN
      DELETE FROM post_hashtags WHERE post_id = NEW.id;
    END IF;
    
    -- Insérer les nouveaux hashtags
    FOREACH tag IN ARRAY tags LOOP
      INSERT INTO hashtags (name, post_count) VALUES (tag, 1)
      ON CONFLICT (name) DO UPDATE SET post_count = hashtags.post_count + 1
      RETURNING id INTO tag_id;
      
      INSERT INTO post_hashtags (post_id, hashtag_id) VALUES (NEW.id, tag_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER extract_post_hashtags
AFTER INSERT OR UPDATE OF caption ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.extract_hashtags();

-- Fonction pour décrémenter le compteur de hashtags quand un post est supprimé
CREATE OR REPLACE FUNCTION public.decrement_hashtag_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE hashtags SET post_count = GREATEST(post_count - 1, 0)
  WHERE id = OLD.hashtag_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER decrement_hashtag_on_delete
AFTER DELETE ON public.post_hashtags
FOR EACH ROW
EXECUTE FUNCTION public.decrement_hashtag_counts();

-- Enable realtime pour follow_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_requests;
