
CREATE TABLE public.study_plan_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id TEXT NOT NULL,
  counselor_name TEXT NOT NULL,
  program TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('plan_created', 'download')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_plan_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON public.study_plan_stats
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON public.study_plan_stats
  FOR SELECT TO anon USING (true);
