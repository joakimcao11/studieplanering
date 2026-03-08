INSERT INTO storage.buckets (id, name, public) VALUES ('template-assets', 'template-assets', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can upload template assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'template-assets');
CREATE POLICY "Anyone can read template assets" ON storage.objects FOR SELECT USING (bucket_id = 'template-assets');
CREATE POLICY "Anyone can update template assets" ON storage.objects FOR UPDATE USING (bucket_id = 'template-assets');
CREATE POLICY "Anyone can delete template assets" ON storage.objects FOR DELETE USING (bucket_id = 'template-assets');