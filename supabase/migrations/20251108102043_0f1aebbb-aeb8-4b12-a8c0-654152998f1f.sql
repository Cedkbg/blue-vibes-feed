-- 1) Create comments table for posts with optional nested replies
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  post_id text not null,
  text text not null check (char_length(text) <= 1000),
  parent_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_comments_parent foreign key (parent_id) references public.comments(id) on delete cascade
);

-- Indexes for performance
create index idx_comments_post_id on public.comments(post_id);
create index idx_comments_parent_id on public.comments(parent_id);
create index idx_comments_user_id on public.comments(user_id);

-- 2) Enable RLS
alter table public.comments enable row level security;

-- 3) RLS Policies
-- Everyone can read comments
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

-- Only authenticated users can insert their own comments
create policy "Users can insert their own comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own comments
create policy "Users can update their own comments"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id);

-- Users can delete their own comments
create policy "Users can delete their own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- 4) Update timestamp trigger (function already exists: update_updated_at_column)
create trigger update_comments_updated_at
before update on public.comments
for each row execute function public.update_updated_at_column();