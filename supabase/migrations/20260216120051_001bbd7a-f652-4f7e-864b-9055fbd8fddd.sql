
-- User settings table for persisting preferences
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  notifications_push BOOLEAN DEFAULT true,
  notifications_likes BOOLEAN DEFAULT true,
  notifications_comments BOOLEAN DEFAULT true,
  notifications_followers BOOLEAN DEFAULT true,
  notifications_messages BOOLEAN DEFAULT true,
  notifications_lives BOOLEAN DEFAULT true,
  notifications_recommendations BOOLEAN DEFAULT false,
  notifications_promotions BOOLEAN DEFAULT false,
  privacy_allow_suggestions BOOLEAN DEFAULT true,
  privacy_sync_contacts BOOLEAN DEFAULT false,
  privacy_allow_comments TEXT DEFAULT 'everyone',
  privacy_allow_messages TEXT DEFAULT 'followers',
  privacy_allow_mentions TEXT DEFAULT 'everyone',
  privacy_allow_duets TEXT DEFAULT 'followers',
  privacy_show_following BOOLEAN DEFAULT true,
  privacy_allow_downloads BOOLEAN DEFAULT true,
  privacy_auto_share BOOLEAN DEFAULT false,
  content_auto_subtitles BOOLEAN DEFAULT true,
  content_auto_translate BOOLEAN DEFAULT false,
  content_sensitive_filter BOOLEAN DEFAULT true,
  content_restricted_mode BOOLEAN DEFAULT false,
  content_high_contrast BOOLEAN DEFAULT false,
  content_auto_play BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  screen_time_daily_limit INTEGER DEFAULT 0,
  screen_time_break_reminders BOOLEAN DEFAULT false,
  screen_time_sleep_mode BOOLEAN DEFAULT false,
  screen_time_sleep_start TEXT DEFAULT '22:00',
  screen_time_sleep_end TEXT DEFAULT '07:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
ON public.user_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Blocked users table
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks"
ON public.blocked_users FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
ON public.blocked_users FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others"
ON public.blocked_users FOR DELETE
USING (auth.uid() = blocker_id);
