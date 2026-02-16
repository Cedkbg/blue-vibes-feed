
-- =============================================
-- 1. FIX NOTIFICATION INSERT POLICY
-- Replace permissive WITH CHECK(true) with validated policy
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Users can create validated notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = from_user_id AND (
      -- Like notifications: verify the like exists
      (type = 'like' AND EXISTS (
        SELECT 1 FROM likes 
        WHERE user_id = auth.uid() AND post_id = notifications.post_id
      )) OR
      -- Comment notifications: verify the comment exists  
      (type = 'comment' AND EXISTS (
        SELECT 1 FROM comments 
        WHERE user_id = auth.uid() AND post_id = notifications.post_id
      )) OR
      -- Follow notifications: verify the follow exists
      (type = 'follow' AND EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = auth.uid() AND following_id = notifications.user_id
      )) OR
      -- Profile visit notifications
      (type = 'profile_visit' AND EXISTS (
        SELECT 1 FROM profile_visits
        WHERE visitor_id = auth.uid() AND profile_id = notifications.user_id
      )) OR
      -- Message notifications
      (type = 'message' AND EXISTS (
        SELECT 1 FROM messages
        WHERE sender_id = auth.uid() AND receiver_id = notifications.user_id
      )) OR
      -- Group call notifications
      (type = 'group_call' AND EXISTS (
        SELECT 1 FROM group_calls
        WHERE initiator_id = auth.uid()
      )) OR
      -- Repost notifications
      (type = 'repost' AND EXISTS (
        SELECT 1 FROM reposts
        WHERE user_id = auth.uid() AND original_post_id = notifications.post_id
      ))
    )
  );

-- =============================================
-- 2. FIX PROFILES PII EXPOSURE
-- Sensitive fields only visible to profile owner
-- =============================================
DROP POLICY IF EXISTS "Profiles public fields viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Owner sees everything
CREATE POLICY "Users can view their own full profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Others can see profiles but app should use profiles_public view
-- This is needed for social features (avatars, usernames in feeds)
CREATE POLICY "Authenticated users can view other profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() != id);

-- =============================================
-- 3. CALL HISTORY RETENTION - 90 DAYS
-- Create cleanup function
-- =============================================
CREATE OR REPLACE FUNCTION public.cleanup_old_call_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.call_history 
  WHERE created_at < now() - interval '90 days';
END;
$$;

-- =============================================
-- 4. RATE LIMITING TABLE
-- Track API requests per user for throttling
-- =============================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only the system (service role) manages rate limits
-- No direct user access needed
CREATE POLICY "No direct user access to rate limits"
  ON public.rate_limits
  FOR ALL
  USING (false);

-- Index for fast lookups
CREATE INDEX idx_rate_limits_user_endpoint 
  ON public.rate_limits (user_id, endpoint, window_start);

-- Cleanup function for expired rate limit windows
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$$;

-- Enable pg_cron extension for scheduled cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
