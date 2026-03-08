CREATE TABLE public.word_template_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.word_template_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read template settings" ON public.word_template_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can update template settings" ON public.word_template_settings FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert template settings" ON public.word_template_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete template settings" ON public.word_template_settings FOR DELETE USING (true);