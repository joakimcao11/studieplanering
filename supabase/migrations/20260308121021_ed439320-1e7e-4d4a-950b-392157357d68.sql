
-- Create programs table for dynamic program management
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  link_url text DEFAULT '',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read programs" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert programs" ON public.programs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update programs" ON public.programs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete programs" ON public.programs FOR DELETE USING (true);

-- Seed existing programs
INSERT INTO public.programs (code, name, link_url) VALUES
  ('D', 'Civilingenjör i Datateknik', 'https://kurser.lth.se/lot/programme?ay=25_26&programme=D'),
  ('C', 'Civilingenjör i Infocom', 'https://kurser.lth.se/lot/programme?ay=25_26&programme=C');
