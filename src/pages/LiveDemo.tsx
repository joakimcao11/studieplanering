import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, SkipForward, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DemoCursor } from '@/components/demo/DemoCursor';
import {
  MockPlanering,
  MockStudentInfo,
  MockImport,
  MockDocSupport,
  MockAdmin,
  MockStats,
  MockPdfDownload,
} from '@/components/demo/MockScreens';
import lthLogo from '@/assets/lth-logo.png';

type ScreenId = 'planering' | 'studentinfo' | 'import' | 'docsupport' | 'admin' | 'stats' | 'pdf';

interface DemoState {
  screen: ScreenId;
  selectedProgram?: string;
  ht2026Courses: { code: string; name: string; hp: number; period: 'lp1' | 'lp2' }[];
  vt2027Courses: { code: string; name: string; hp: number; period: 'lp3' | 'lp4' }[];
  showVt2027: boolean;
  studentName?: string;
  studentYear?: string;
  actionItems: string[];
  highlightId?: string;
  importedText?: string;
  importGenerated?: boolean;
  uploadedImage?: boolean;
  aiAnalysis?: string;
  cursor: { x: number; y: number; clicking?: boolean; label?: string };
  introVisible?: boolean;
  outroVisible?: boolean;
}

const initialState: DemoState = {
  screen: 'planering',
  ht2026Courses: [],
  vt2027Courses: [],
  showVt2027: false,
  actionItems: [],
  cursor: { x: 50, y: 50 },
  introVisible: true,
};

interface Step {
  duration: number;
  apply: (set: (updater: (s: DemoState) => DemoState) => void) => void;
  stage: number; // 0..4 → which of the 5 main stages this belongs to
  label: string;
}

const STAGE_LABELS = [
  'Studieplanering',
  'Importera plan',
  'Dokumentationsstöd',
  'Admin',
  'Statistik',
];

// Build the timeline. Total ~ 2:45.
const buildSteps = (): Step[] => {
  const steps: Step[] = [];
  const move = (x: number, y: number, label?: string) => (set: any) =>
    set((s: DemoState) => ({ ...s, cursor: { x, y, label } }));
  const click = (x: number, y: number, label?: string) => (set: any) =>
    set((s: DemoState) => ({ ...s, cursor: { x, y, clicking: true, label } }));

  // Intro
  steps.push({ duration: 4000, stage: 0, label: 'Introduktion', apply: (set) => set((s) => ({ ...s, introVisible: true })) });
  steps.push({ duration: 200, stage: 0, label: 'Start', apply: (set) => set((s) => ({ ...s, introVisible: false })) });

  // Stage 1: Studieplanering (50s)
  steps.push({ duration: 1000, stage: 0, label: 'Öppnar Studieplanering', apply: move(50, 20, 'Studieplanering') });
  steps.push({ duration: 1500, stage: 0, label: 'Väljer program', apply: click(80, 15, 'Väljer program: D') });
  steps.push({
    duration: 800, stage: 0, label: 'Program valt',
    apply: (set) => set((s) => ({ ...s, selectedProgram: 'Datateknik (D)', highlightId: 'program', cursor: { x: 80, y: 15 } })),
  });

  // HT2026 LP1
  steps.push({ duration: 1000, stage: 0, label: 'Lägger till kurser i LP1', apply: move(50, 45, 'Lägger till kurser i LP1') });
  steps.push({
    duration: 1200, stage: 0, label: 'EDAA01',
    apply: (set) => set((s) => ({
      ...s, highlightId: 'ht2026',
      ht2026Courses: [...s.ht2026Courses, { code: 'EDAA01', name: 'Programmeringsteknik', hp: 7.5, period: 'lp1' }],
    })),
  });
  steps.push({
    duration: 1200, stage: 0, label: 'FMAB65',
    apply: (set) => set((s) => ({
      ...s,
      ht2026Courses: [...s.ht2026Courses, { code: 'FMAB65', name: 'Linjär algebra', hp: 7.5, period: 'lp1' }],
    })),
  });

  // HT2026 LP2
  steps.push({ duration: 800, stage: 0, label: 'Fortsätter med LP2', apply: move(50, 60, 'Lägger till kurser i LP2') });
  steps.push({
    duration: 1200, stage: 0, label: 'EDAF05',
    apply: (set) => set((s) => ({
      ...s,
      ht2026Courses: [...s.ht2026Courses, { code: 'EDAF05', name: 'Algoritmer & datastrukturer', hp: 7.5, period: 'lp2' }],
    })),
  });
  steps.push({
    duration: 1500, stage: 0, label: 'FMAB70 — HT klar (30 hp)',
    apply: (set) => set((s) => ({
      ...s,
      ht2026Courses: [...s.ht2026Courses, { code: 'FMAB70', name: 'Flerdimensionell analys', hp: 7.5, period: 'lp2' }],
    })),
  });

  // Add VT2027
  steps.push({ duration: 1200, stage: 0, label: 'Lägger till nästa termin', apply: click(85, 75, '+ Lägg till termin') });
  steps.push({
    duration: 800, stage: 0, label: 'VT2027 skapad',
    apply: (set) => set((s) => ({ ...s, showVt2027: true, highlightId: 'vt2027' })),
  });

  // VT2027 LP3+LP4
  steps.push({ duration: 1000, stage: 0, label: 'Fyller VT2027', apply: move(50, 85) });
  steps.push({
    duration: 1000, stage: 0, label: 'EDAF50',
    apply: (set) => set((s) => ({
      ...s,
      vt2027Courses: [...s.vt2027Courses, { code: 'EDAF50', name: 'C++ programmering', hp: 7.5, period: 'lp3' }],
    })),
  });
  steps.push({
    duration: 1000, stage: 0, label: 'FMAB30',
    apply: (set) => set((s) => ({
      ...s,
      vt2027Courses: [...s.vt2027Courses, { code: 'FMAB30', name: 'Endimensionell analys', hp: 7.5, period: 'lp3' }],
    })),
  });
  steps.push({
    duration: 1000, stage: 0, label: 'EDAF15',
    apply: (set) => set((s) => ({
      ...s,
      vt2027Courses: [...s.vt2027Courses, { code: 'EDAF15', name: 'Algoritmimplementering', hp: 7.5, period: 'lp4' }],
    })),
  });
  steps.push({
    duration: 1500, stage: 0, label: 'FMSF55 — VT klar (30 hp)',
    apply: (set) => set((s) => ({
      ...s,
      vt2027Courses: [...s.vt2027Courses, { code: 'FMSF55', name: 'Sannolikhetsteori', hp: 7.5, period: 'lp4' }],
    })),
  });

  // Studentinfo + handlingsplan
  steps.push({
    duration: 800, stage: 0, label: 'Öppnar studentinfo',
    apply: (set) => set((s) => ({ ...s, screen: 'studentinfo', cursor: { x: 50, y: 30 }, highlightId: 'studentinfo' })),
  });
  steps.push({
    duration: 1500, stage: 0, label: 'Skriver namn',
    apply: (set) => set((s) => ({ ...s, studentName: 'Student A' })),
  });
  steps.push({
    duration: 1200, stage: 0, label: 'Väljer kull',
    apply: (set) => set((s) => ({ ...s, studentYear: 'D23' })),
  });
  steps.push({
    duration: 800, stage: 0, label: 'Lägger till handlingspunkt',
    apply: (set) => set((s) => ({ ...s, highlightId: 'actionplan', cursor: { x: 50, y: 70 } })),
  });
  steps.push({
    duration: 1500, stage: 0, label: 'Uppgift 1',
    apply: (set) => set((s) => ({ ...s, actionItems: ['Kontakta kursansvarig för omregistrering i FMAB70'] })),
  });
  steps.push({
    duration: 1500, stage: 0, label: 'Uppgift 2',
    apply: (set) => set((s) => ({
      ...s,
      actionItems: [...s.actionItems, 'Boka uppföljningsmöte med studievägledaren i slutet av terminen'],
    })),
  });

  // Stage 2: Importera plan
  steps.push({
    duration: 800, stage: 1, label: 'Importera plan',
    apply: (set) => set((s) => ({ ...s, screen: 'import', highlightId: undefined, cursor: { x: 50, y: 30, label: 'Importera plan' } })),
  });
  steps.push({
    duration: 2000, stage: 1, label: 'Klistrar in samtal',
    apply: (set) => set((s) => ({
      ...s,
      importedText: 'Idag 26-02-16 möte med David (D23). Plan VT25: Fotonik + Programmeringsteknik fördjupning. Omtenta april: FMAB70. Återkomst innan LP4.',
    })),
  });
  steps.push({
    duration: 1500, stage: 1, label: 'AI genererar', apply: click(50, 70, 'Generera minnesanteckning'),
  });
  steps.push({
    duration: 2500, stage: 1, label: 'Resultat',
    apply: (set) => set((s) => ({ ...s, importGenerated: true })),
  });

  // Stage 3: Dokumentationsstöd
  steps.push({
    duration: 800, stage: 2, label: 'Dokumentationsstöd',
    apply: (set) => set((s) => ({ ...s, screen: 'docsupport', cursor: { x: 50, y: 30, label: 'Dokumentationsstöd' } })),
  });
  steps.push({
    duration: 1500, stage: 2, label: 'Drar in whiteboard-bild',
    apply: (set) => set((s) => ({ ...s, uploadedImage: true })),
  });
  steps.push({
    duration: 1500, stage: 2, label: 'AI analyserar', apply: click(50, 75, 'Analysera material'),
  });
  steps.push({
    duration: 2500, stage: 2, label: 'AI-svar',
    apply: (set) => set((s) => ({
      ...s,
      aiAnalysis: 'Mindmap identifierad: 4 huvudspår — Karriär, Specialisering, Internationellt utbyte, Examensarbete. Rekommenderar fördjupningssamtal kring Specialisering.',
    })),
  });

  // Stage 4: Admin
  steps.push({
    duration: 800, stage: 3, label: 'Admin',
    apply: (set) => set((s) => ({ ...s, screen: 'admin', cursor: { x: 50, y: 30, label: 'Admin' } })),
  });
  steps.push({ duration: 3500, stage: 3, label: 'Översikt', apply: () => {} });

  // Stage 5: Statistik
  steps.push({
    duration: 800, stage: 4, label: 'Statistik',
    apply: (set) => set((s) => ({ ...s, screen: 'stats', cursor: { x: 50, y: 30, label: 'Statistik' } })),
  });
  steps.push({ duration: 4000, stage: 4, label: 'Trender', apply: () => {} });

  // Outro: download PDF
  steps.push({
    duration: 1000, stage: 4, label: 'Laddar ner underlag',
    apply: (set) => set((s) => ({ ...s, screen: 'pdf', cursor: { x: 50, y: 50, label: 'Underlag nedladdat' } })),
  });
  steps.push({ duration: 4000, stage: 4, label: 'Förhandsvisning', apply: () => {} });
  steps.push({
    duration: 100, stage: 4, label: 'Slut',
    apply: (set) => set((s) => ({ ...s, outroVisible: true })),
  });

  return steps;
};

const LiveDemo = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<DemoState>(initialState);
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const stepsRef = useRef<Step[]>(buildSteps());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalDuration = stepsRef.current.reduce((sum, s) => sum + s.duration, 0);
  const elapsed = stepsRef.current.slice(0, Math.max(0, stepIndex + 1)).reduce((sum, s) => sum + s.duration, 0);
  const progress = (elapsed / totalDuration) * 100;

  const currentStage = stepIndex >= 0 ? stepsRef.current[Math.min(stepIndex, stepsRef.current.length - 1)]?.stage ?? 0 : 0;
  const currentLabel = stepIndex >= 0 ? stepsRef.current[Math.min(stepIndex, stepsRef.current.length - 1)]?.label ?? '' : '';

  const runStep = useCallback((idx: number) => {
    const steps = stepsRef.current;
    if (idx >= steps.length) {
      setPlaying(false);
      setCompleted(true);
      return;
    }
    const step = steps[idx];
    step.apply(setState);
    timerRef.current = setTimeout(() => {
      // Reset clicking state
      setState((s) => ({ ...s, cursor: { ...s.cursor, clicking: false } }));
      setStepIndex(idx + 1);
    }, step.duration);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (stepIndex < 0) return;
    runStep(stepIndex);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, playing]);

  const handleStart = () => {
    setState({ ...initialState, introVisible: true });
    setCompleted(false);
    setStepIndex(0);
    setPlaying(true);
  };

  const handlePause = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlaying(false);
  };

  const handleResume = () => {
    setPlaying(true);
  };

  const handleSkip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStepIndex((i) => i + 1);
  };

  const handleRestart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState({ ...initialState, introVisible: true });
    setCompleted(false);
    setStepIndex(0);
    setPlaying(true);
  };

  const renderScreen = () => {
    switch (state.screen) {
      case 'planering': return <MockPlanering state={state as any} />;
      case 'studentinfo': return <MockStudentInfo state={state as any} />;
      case 'import': return <MockImport state={state as any} />;
      case 'docsupport': return <MockDocSupport state={state as any} />;
      case 'admin': return <MockAdmin />;
      case 'stats': return <MockStats />;
      case 'pdf': return <MockPdfDownload />;
      default: return null;
    }
  };

  const isRunning = stepIndex >= 0 && !completed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Top bar */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={lthLogo} alt="LTH" className="h-8" />
            <div>
              <h1 className="text-base font-bold leading-tight">Live-demo</h1>
              <p className="text-xs text-muted-foreground">Studievägledningsverktyget LTH</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Tillbaka
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {!isRunning && !completed && (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Se hur verktyget fungerar
              <br />
              <span className="text-primary">på under 3 minuter</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              En automatiserad demonstration av flödet — från studieplanering och dokumentation
              till administration och statistik. Inget krav på inloggning.
            </p>
            <Button size="lg" onClick={handleStart} className="text-lg px-8 py-6 rounded-2xl shadow-lg hover-scale">
              <Play className="w-5 h-5 mr-2" fill="currentColor" /> Starta simulering
            </Button>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-3 max-w-3xl mx-auto">
              {STAGE_LABELS.map((label, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Steg {i + 1}</div>
                    <div className="text-sm font-semibold">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {isRunning && (
          <div className="space-y-4 animate-fade-in">
            {/* Progress + controls */}
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Steg {currentStage + 1} av 5</div>
                    <div className="text-sm font-semibold">{STAGE_LABELS[currentStage]}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {playing ? (
                      <Button variant="outline" size="sm" onClick={handlePause}>
                        <Pause className="w-4 h-4 mr-1" /> Pausa
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleResume}>
                        <Play className="w-4 h-4 mr-1" /> Spela
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleSkip}>
                      <SkipForward className="w-4 h-4 mr-1" /> Hoppa
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleRestart}>
                      <RotateCcw className="w-4 h-4 mr-1" /> Om
                    </Button>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="mt-2 text-xs text-muted-foreground italic">{currentLabel}</div>
              </CardContent>
            </Card>

            {/* Mock app frame */}
            <div className="relative">
              <Card className="rounded-2xl overflow-hidden shadow-2xl border-2">
                {/* Faux browser top */}
                <div className="bg-muted/60 border-b px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                    <div className="w-3 h-3 rounded-full bg-green-400/70" />
                  </div>
                  <div className="ml-4 flex-1 bg-background rounded px-3 py-1 text-xs text-muted-foreground">
                    studieplanering.lth.se / {state.screen}
                  </div>
                </div>
                <CardContent className="p-6 min-h-[520px] relative bg-background">
                  {state.introVisible && (
                    <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                      <Sparkles className="w-12 h-12 text-primary mb-4" />
                      <h3 className="text-2xl font-bold mb-2">Möt Student A</h3>
                      <p className="text-muted-foreground">Datateknik, kull 2023</p>
                    </div>
                  )}
                  {renderScreen()}
                  {!state.introVisible && (
                    <DemoCursor
                      x={state.cursor.x}
                      y={state.cursor.y}
                      clicking={state.cursor.clicking}
                      label={state.cursor.label}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {completed && (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 mb-6">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Demo klar!</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Du har sett hela flödet — från studieplanering till nedladdning av underlag.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button size="lg" onClick={handleRestart} className="rounded-2xl">
                <RotateCcw className="w-4 h-4 mr-2" /> Spela om
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/')} className="rounded-2xl">
                Till verktyget
              </Button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t mt-12 py-4 text-center text-xs text-muted-foreground">
        Studie- och karriärvägledningen LTH — Live-demo
      </footer>
    </div>
  );
};

export default LiveDemo;
