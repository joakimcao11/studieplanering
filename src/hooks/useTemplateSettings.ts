import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateSettings {
  font_name: string;
  font_size_normal: string;
  font_size_heading1: string;
  font_size_heading2: string;
  font_size_heading3: string;
  document_title: string;
  exam_info_title: string;
  exam_info_text: string;
  footer_text: string;
  purpose_text: string;
}

const defaults: TemplateSettings = {
  font_name: 'Times New Roman',
  font_size_normal: '24',
  font_size_heading1: '32',
  font_size_heading2: '28',
  font_size_heading3: '26',
  document_title: 'MINNESANTECKNINGAR – STUDIEPLANERING',
  exam_info_title: 'Utbildningens upplägg och examenskrav',
  exam_info_text: '',
  footer_text: 'Studie- och karriärvägledningen LTH',
  purpose_text: 'Studieplanering med studievägledare',
};

export const useTemplateSettings = () => {
  const [settings, setSettings] = useState<TemplateSettings>(defaults);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('word_template_settings')
      .select('setting_key, setting_value');
    if (!error && data) {
      const mapped = { ...defaults };
      data.forEach((row: any) => {
        if (row.setting_key in mapped) {
          (mapped as any)[row.setting_key] = row.setting_value;
        }
      });
      setSettings(mapped);
    }
    setLoading(false);
  };

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('word_template_settings')
      .update({ setting_value: value, updated_at: new Date().toISOString() })
      .eq('setting_key', key);
    if (!error) {
      setSettings(prev => ({ ...prev, [key]: value }));
    }
    return error;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, updateSetting, refetch: fetchSettings };
};
