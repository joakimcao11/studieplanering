import { supabase } from '@/integrations/supabase/client';

export const trackPlanCreated = async (counselorId: string, counselorName: string, program: string) => {
  try {
    await supabase.from('study_plan_stats').insert({
      counselor_id: counselorId,
      counselor_name: counselorName,
      program: program || 'Okänt',
      action_type: 'plan_created',
    });
  } catch (e) {
    console.error('Failed to track plan created:', e);
  }
};

export const trackDownload = async (counselorId: string, counselorName: string, program: string) => {
  try {
    await supabase.from('study_plan_stats').insert({
      counselor_id: counselorId,
      counselor_name: counselorName,
      program: program || 'Okänt',
      action_type: 'download',
    });
  } catch (e) {
    console.error('Failed to track download:', e);
  }
};
