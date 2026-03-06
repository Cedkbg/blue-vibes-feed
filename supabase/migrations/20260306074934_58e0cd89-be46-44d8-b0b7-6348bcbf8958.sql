
-- Student portfolios
CREATE TABLE public.student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  university text,
  field_of_study text,
  graduation_year integer,
  bio text,
  skills text[] DEFAULT '{}',
  cv_url text,
  portfolio_url text,
  linkedin_url text,
  github_url text,
  gpa text,
  looking_for text DEFAULT 'stage',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view all profiles" ON public.student_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own student profile" ON public.student_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own student profile" ON public.student_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own student profile" ON public.student_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Company pages
CREATE TABLE public.company_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  logo_url text,
  cover_url text,
  description text,
  industry text,
  website text,
  location text,
  size text,
  founded_year integer,
  followers_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company pages viewable by everyone" ON public.company_pages FOR SELECT USING (true);
CREATE POLICY "Users can create company pages" ON public.company_pages FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update company pages" ON public.company_pages FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete company pages" ON public.company_pages FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Job listings
CREATE TABLE public.job_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.company_pages(id) ON DELETE CASCADE NOT NULL,
  poster_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  job_type text NOT NULL DEFAULT 'full-time',
  experience_level text DEFAULT 'entry',
  salary_range text,
  skills_required text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  applications_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active jobs viewable by everyone" ON public.job_listings FOR SELECT USING (is_active = true);
CREATE POLICY "Posters can create jobs" ON public.job_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = poster_id);
CREATE POLICY "Posters can update jobs" ON public.job_listings FOR UPDATE TO authenticated USING (auth.uid() = poster_id);
CREATE POLICY "Posters can delete jobs" ON public.job_listings FOR DELETE TO authenticated USING (auth.uid() = poster_id);

-- Job applications
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.job_listings(id) ON DELETE CASCADE NOT NULL,
  applicant_id uuid NOT NULL,
  cv_url text,
  cover_letter text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view own applications" ON public.job_applications FOR SELECT TO authenticated USING (auth.uid() = applicant_id);
CREATE POLICY "Job posters can view applications" ON public.job_applications FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.job_listings WHERE id = job_applications.job_id AND poster_id = auth.uid())
);
CREATE POLICY "Users can apply to jobs" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Users can update own applications" ON public.job_applications FOR UPDATE TO authenticated USING (auth.uid() = applicant_id);
