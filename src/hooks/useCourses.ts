import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Course } from '@/data/courses';

export const useCourses = (program?: string) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    let query = supabase.from('courses').select('*').order('year').order('code');
    if (program && program !== 'custom') {
      query = query.eq('program', program);
    }
    const { data, error } = await query;
    if (!error && data) {
      setCourses(data.map((row: any) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        hp: Number(row.hp),
        level: row.level,
        year: row.year,
        periods: row.periods || [],
        isObligatory: row.is_obligatory,
        program: row.program,
        isMultiPeriod: row.is_multi_period || false,
        defaultStudyPace: row.default_study_pace || undefined,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, [program]);

  return { courses, loading, refetch: fetchCourses };
};

export const useCounselorProfiles = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('counselor_profiles').select('*').order('created_at');
    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return { profiles, loading, refetch: fetchProfiles };
};
