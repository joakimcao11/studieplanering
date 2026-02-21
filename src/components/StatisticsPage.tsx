import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, BarChart3, Download, FileText, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { COUNSELORS, getCounselorById } from '@/types/planning';

interface StatisticsPageProps {
  onBack: () => void;
}

interface StatsRow {
  counselor_id: string;
  counselor_name: string;
  program: string;
  action_type: string;
  created_at: string;
}

export const StatisticsPage = ({ onBack }: StatisticsPageProps) => {
  const [stats, setStats] = useState<StatsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from('study_plan_stats')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setStats(data as StatsRow[]);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  // Aggregate stats per counselor
  const counselorStats = [...COUNSELORS.map(c => c.id), 'other'].map(id => {
    const isOther = id === 'other';
    const counselorRows = stats.filter(s => {
      if (isOther) return s.counselor_id.startsWith('custom:');
      return s.counselor_id === id;
    });
    
    const plans = counselorRows.filter(r => r.action_type === 'plan_created').length;
    const downloads = counselorRows.filter(r => r.action_type === 'download').length;
    const programs = [...new Set(counselorRows.map(r => r.program))].filter(Boolean);
    
    const counselor = isOther 
      ? { displayName: 'Övriga vägledare', name: 'Övriga' }
      : getCounselorById(id);

    return {
      id,
      name: counselor?.displayName || id,
      plans,
      downloads,
      programs,
    };
  });

  const totalPlans = stats.filter(r => r.action_type === 'plan_created').length;
  const totalDownloads = stats.filter(r => r.action_type === 'download').length;

  // Program breakdown
  const programCounts: Record<string, number> = {};
  stats.filter(r => r.action_type === 'plan_created').forEach(r => {
    const p = r.program || 'Okänt';
    programCounts[p] = (programCounts[p] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
        <h2 className="text-xl font-bold text-foreground">Statistik</h2>
        <div />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Studieplaner skapade</p>
                <p className="text-2xl font-bold text-foreground">{totalPlans}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nedladdningar</p>
                <p className="text-2xl font-bold text-foreground">{totalDownloads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Program</p>
                <p className="text-2xl font-bold text-foreground">{Object.keys(programCounts).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per counselor table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Statistik per studievägledare
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Laddar...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Studievägledare</TableHead>
                  <TableHead className="text-center">Planer</TableHead>
                  <TableHead className="text-center">Nedladdningar</TableHead>
                  <TableHead>Program</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counselorStats.map(cs => (
                  <TableRow key={cs.id}>
                    <TableCell className="font-medium">{cs.name}</TableCell>
                    <TableCell className="text-center">{cs.plans}</TableCell>
                    <TableCell className="text-center">{cs.downloads}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cs.programs.map(p => (
                          <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Program breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Fördelning per program</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(programCounts).length === 0 ? (
            <p className="text-muted-foreground text-sm">Ingen data ännu</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(programCounts).sort((a, b) => b[1] - a[1]).map(([program, count]) => (
                <div key={program} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{program}</span>
                  <Badge>{count} planer</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
