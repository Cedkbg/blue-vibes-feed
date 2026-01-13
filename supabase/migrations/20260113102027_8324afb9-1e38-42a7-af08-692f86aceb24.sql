-- Create function to update comments_count on insert
CREATE OR REPLACE FUNCTION public.increment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts 
  SET comments_count = comments_count + 1 
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to update comments_count on delete
CREATE OR REPLACE FUNCTION public.decrement_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts 
  SET comments_count = GREATEST(comments_count - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for insert
DROP TRIGGER IF EXISTS trigger_increment_comments_count ON public.comments;
CREATE TRIGGER trigger_increment_comments_count
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.increment_comments_count();

-- Create trigger for delete
DROP TRIGGER IF EXISTS trigger_decrement_comments_count ON public.comments;
CREATE TRIGGER trigger_decrement_comments_count
AFTER DELETE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.decrement_comments_count();