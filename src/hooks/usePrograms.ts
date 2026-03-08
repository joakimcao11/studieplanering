import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProgramData {
  id: string;
  code: string;
  name: string;
  link_url: string;
}

export const usePrograms = () => {
  const [programs, setPrograms] = useState<ProgramData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrograms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('code');
    if (!error && data) {
      setPrograms(data.map((row: any) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        link_url: row.link_url || '',
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  return { programs, loading, refetch: fetchPrograms };
};
