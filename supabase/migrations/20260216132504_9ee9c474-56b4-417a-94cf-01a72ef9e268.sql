
-- 1. Create a public view for profiles that hides sensitive fields
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
  SELECT id, username, display_name, bio, avatar_url, external_link, 
         is_private, is_verified, is_online, last_seen, profession, location, 
         language, created_at, updated_at
  FROM public.profiles;
-- Note: phone_number, birthdate, first_name, last_name are excluded

-- 2. Fix the overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. Add unique constraint on push_tokens to prevent duplicates per user/token
ALTER TABLE public.push_tokens 
  ADD CONSTRAINT push_tokens_user_token_unique UNIQUE (user_id, token);

-- 4. Add UPDATE policy for push_tokens so users can refresh their tokens
CREATE POLICY "Users can update their own push tokens"
  ON public.push_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
