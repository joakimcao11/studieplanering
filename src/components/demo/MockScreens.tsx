import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, FileText, Sparkles, BarChart3, Settings, GraduationCap, Check, Clock, Users, TrendingUp } from 'lucide-react';

interface DemoState {
  selectedProgram?: string;
  ht2026Courses: { code: string; name: string; hp: number; period: 'lp1' | 'lp2' }[];
  vt2027Courses: { code: string; name: string; hp: number; period: 'lp3' | 'lp4' }[];
  showVt2027?: boolean;
  studentName?: string;
  studentYear?: string;
  actionItems: string[];
  highlightId?: string;
  importedText?: string;
  importGenerated?: boolean;
  uploadedImage?: boolean;
  aiAnalysis?: string;
  pdfOpen?: boolean;
}

const Highlight = ({ active, children }: { active: boolean; children: React.ReactNode }) => (
  <div
    className={`transition-all duration-500 rounded-lg ${
      active ? 'ring-4 ring-primary/60 ring-offset-2 shadow-2xl scale-[1.01]' : ''
    }`}
  >
    {children}
  </div>
);

export const MockPlanering = ({ state }: { state: DemoState }) => {
  const ht2026Lp1 = state.ht2026Courses.filter(c => c.period === 'lp1');
  const ht2026Lp2 = state.ht2026Courses.filter(c => c.period === 'lp2');
  const vt2027Lp3 = state.vt2027Courses.filter(c => c.period === 'lp3');
  const vt2027Lp4 = state.vt2027Courses.filter(c => c.period === 'lp4');

  const lp1Hp = ht2026Lp1.reduce((s, c) => s + c.hp, 0);
  const lp2Hp = ht2026Lp2.reduce((s, c) => s + c.hp, 0);
  const lp3Hp = vt2027Lp3.reduce((s, c) => s + c.hp, 0);
  const lp4Hp = vt2027Lp4.reduce((s, c) => s + c.hp, 0);
  const ht2026Total = lp1Hp + lp2Hp;
  const vt2027Total = lp3Hp + lp4Hp;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Studieplanering
        </h2>
        <Highlight active={state.highlightId === 'program'}>
          <Badge variant="outline" className="text-sm py-1 px-3">
            Program: {state.selectedProgram || '—'}
          </Badge>
        </Highlight>
      </div>

      <Highlight active={state.highlightId === 'ht2026'}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Hösttermin 2026</CardTitle>
              <Badge className={ht2026Total >= 30 ? 'bg-green-500' : 'bg-amber-500'}>
                {ht2026Total} / 30 hp
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">LP1 ({lp1Hp} hp)</span>
                {lp1Hp >= 15 && <Check className="w-4 h-4 text-green-600" />}
              </div>
              <Progress value={(lp1Hp / 15) * 100} className="h-2" />
              <div className="mt-2 space-y-1">
                {ht2026Lp1.map((c, i) => (
                  <div key={i} className="text-xs bg-muted rounded px-2 py-1 animate-fade-in">
                    <span className="font-mono font-semibold">{c.code}</span> — {c.name} <span className="text-muted-foreground">({c.hp} hp)</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">LP2 ({lp2Hp} hp)</span>
                {lp2Hp >= 15 && <Check className="w-4 h-4 text-green-600" />}
              </div>
              <Progress value={(lp2Hp / 15) * 100} className="h-2" />
              <div className="mt-2 space-y-1">
                {ht2026Lp2.map((c, i) => (
                  <div key={i} className="text-xs bg-muted rounded px-2 py-1 animate-fade-in">
                    <span className="font-mono font-semibold">{c.code}</span> — {c.name} <span className="text-muted-foreground">({c.hp} hp)</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </Highlight>

      {state.showVt2027 && (
        <Highlight active={state.highlightId === 'vt2027'}>
          <Card className="animate-fade-in">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Vårtermin 2027</CardTitle>
                <Badge className={vt2027Total >= 30 ? 'bg-green-500' : 'bg-amber-500'}>
                  {vt2027Total} / 30 hp
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">LP3 ({lp3Hp} hp)</span>
                  {lp3Hp >= 15 && <Check className="w-4 h-4 text-green-600" />}
                </div>
                <Progress value={(lp3Hp / 15) * 100} className="h-2" />
                <div className="mt-2 space-y-1">
                  {vt2027Lp3.map((c, i) => (
                    <div key={i} className="text-xs bg-muted rounded px-2 py-1 animate-fade-in">
                      <span className="font-mono font-semibold">{c.code}</span> — {c.name} <span className="text-muted-foreground">({c.hp} hp)</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">LP4 ({lp4Hp} hp)</span>
                  {lp4Hp >= 15 && <Check className="w-4 h-4 text-green-600" />}
                </div>
                <Progress value={(lp4Hp / 15) * 100} className="h-2" />
                <div className="mt-2 space-y-1">
                  {vt2027Lp4.map((c, i) => (
                    <div key={i} className="text-xs bg-muted rounded px-2 py-1 animate-fade-in">
                      <span className="font-mono font-semibold">{c.code}</span> — {c.name} <span className="text-muted-foreground">({c.hp} hp)</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </Highlight>
      )}
    </div>
  );
};

export const MockStudentInfo = ({ state }: { state: DemoState }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-primary" />
        Grundinformation & Handlingsplan
      </h2>

      <Highlight active={state.highlightId === 'studentinfo'}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Student</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Namn:</span>
              <span className="font-medium">{state.studentName || '—'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Program:</span>
              <span className="font-medium">Datateknik (D)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kull:</span>
              <span className="font-medium">{state.studentYear || '—'}</span>
            </div>
          </CardContent>
        </Card>
      </Highlight>

      <Highlight active={state.highlightId === 'actionplan'}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Handlingsplan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {state.actionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Inga uppgifter ännu</p>
            ) : (
              state.actionItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-muted rounded animate-fade-in">
                  <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </Highlight>
    </div>
  );
};

export const MockImport = ({ state }: { state: DemoState }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold flex items-center gap-2">
      <FileText className="w-5 h-5 text-primary" />
      Importera plan
    </h2>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Klistra in samtalsanteckningar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-[120px] rounded-md border bg-muted/40 p-3 text-sm font-mono leading-relaxed">
          {state.importedText || <span className="text-muted-foreground italic">Klistra in text här...</span>}
        </div>
        {state.importGenerated && (
          <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-md animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">AI-genererad minnesanteckning</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Student David, D23 — Vårterminsplan 2025: Fotonik (FAFA60), Programmeringsteknik fördjupning.
              Omtenta i april: FMAB70. Uppföljningsmöte innan LP4.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

export const MockDocSupport = ({ state }: { state: DemoState }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold flex items-center gap-2">
      <Sparkles className="w-5 h-5 text-primary" />
      Dokumentationsstöd
    </h2>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Uppladdat material</CardTitle>
      </CardHeader>
      <CardContent>
        {state.uploadedImage ? (
          <div className="rounded-md bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 p-6 flex flex-col items-center justify-center min-h-[120px] animate-fade-in">
            <FileText className="w-10 h-10 text-primary mb-2" />
            <span className="text-sm font-medium">whiteboard-foto.jpg</span>
            <span className="text-xs text-muted-foreground">Mindmap • 2.3 MB</span>
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-md p-6 text-center text-sm text-muted-foreground">
            Dra och släpp filer här
          </div>
        )}
        {state.aiAnalysis && (
          <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-md animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">AI-analys</span>
            </div>
            <p className="text-xs text-muted-foreground">{state.aiAnalysis}</p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

export const MockAdmin = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold flex items-center gap-2">
      <Settings className="w-5 h-5 text-primary" />
      Admin
    </h2>
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: 'Program', value: '12', icon: BookOpen },
        { label: 'Kurser', value: '847', icon: FileText },
        { label: 'Vägledare', value: '8', icon: Users },
        { label: 'Mallar', value: '3', icon: Settings },
      ].map((stat, i) => (
        <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <CardContent className="p-4 text-center">
            <stat.icon className="w-6 h-6 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const MockStats = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold flex items-center gap-2">
      <BarChart3 className="w-5 h-5 text-primary" />
      Statistik
    </h2>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          Studieplaner skapade — senaste 30 dagar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-32 gap-1">
          {[40, 65, 50, 80, 95, 70, 110, 85, 120, 100, 90, 130].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/70 rounded-t animate-fade-in"
              style={{ height: `${h * 0.7}%`, animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="text-2xl font-bold text-primary">127</div>
            <div className="text-xs text-muted-foreground">Den här månaden</div>
          </div>
          <div>
            <div className="text-2xl font-bold">+18%</div>
            <div className="text-xs text-muted-foreground">vs förra månaden</div>
          </div>
          <div>
            <div className="text-2xl font-bold">94</div>
            <div className="text-xs text-muted-foreground">Aktiva vägledare</div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const MockPdfDownload = () => (
  <div className="space-y-4 animate-fade-in">
    <h2 className="text-xl font-bold flex items-center gap-2">
      <FileText className="w-5 h-5 text-primary" />
      Minnesanteckning – Student A
    </h2>
    <Card className="overflow-hidden">
      <div className="bg-white dark:bg-card p-6 max-h-[300px] overflow-hidden">
        <div className="border-b-2 border-primary/40 pb-3 mb-3">
          <div className="flex justify-between items-start">
            <div className="text-xs text-muted-foreground">LTH</div>
            <div className="text-right text-xs">
              <div className="font-bold">Studievägledningssamtal</div>
              <div>Joakim Cao</div>
              <div>{new Date().toLocaleDateString('sv-SE')}</div>
            </div>
          </div>
        </div>
        <h3 className="text-lg font-bold text-primary mb-3 border-b border-primary/30 pb-1">MINNESANTECKNING</h3>
        <div className="text-xs space-y-2 text-foreground/90 leading-relaxed">
          <p><span className="font-semibold">Student:</span> Student A — Datateknik D23</p>
          <p><span className="font-semibold">Datum:</span> {new Date().toLocaleDateString('sv-SE')}</p>
          <p><span className="font-semibold">Termin:</span> HT2026 + VT2027</p>
          <p className="pt-2"><span className="font-semibold">Studieplanering:</span> Heltid (30 hp/termin) över LP1–LP4 enligt plan.</p>
          <p><span className="font-semibold">Handlingsplan:</span> Kontakta kursansvarig för omregistrering. Boka uppföljningsmöte.</p>
        </div>
      </div>
    </Card>
  </div>
);
