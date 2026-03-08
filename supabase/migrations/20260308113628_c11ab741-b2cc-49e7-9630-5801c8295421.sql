
-- Courses table for managing program courses dynamically
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  hp numeric NOT NULL,
  level text NOT NULL DEFAULT 'G1',
  year integer NOT NULL DEFAULT 1,
  periods text[] DEFAULT '{}',
  is_obligatory boolean NOT NULL DEFAULT true,
  program text NOT NULL,
  is_multi_period boolean DEFAULT false,
  default_study_pace integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Everyone can read courses (public data)
CREATE POLICY "Anyone can read courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert courses" ON public.courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update courses" ON public.courses FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete courses" ON public.courses FOR DELETE USING (true);

-- STVL profiles table for managing counselor profiles dynamically
CREATE TABLE public.counselor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_key text NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  display_name text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.counselor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles" ON public.counselor_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON public.counselor_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON public.counselor_profiles FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete profiles" ON public.counselor_profiles FOR DELETE USING (true);
