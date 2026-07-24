import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  GraduationCap, Home, ListChecks, Info, HelpCircle, FileText, FileType2, FileDown, Wand2, RotateCcw, Trash2, Sparkles, Undo2,
} from 'lucide-react';
import { StudyPlanCanvas, ActionPlanItem } from '@/components/meeting/StudyPlanCanvas';
import { ExportPreviewDialog, DocSection } from '@/components/export/ExportPreviewDialog';
import { StudentOnboarding } from '@/components/student/StudentOnboarding';
import { StudentAiPanel } from '@/components/student/StudentAiPanel';
import {
  loadStudentPlan, clearStudentPlan, useDebouncedStudentPlanSave,
  type StudentActionPlanItem,
} from '@/hooks/useStudentPlanStorage';
import { usePrograms } from '@/hooks/usePrograms';
import { useToast } from '@/hooks/use-toast';
import { exportSectionsAsPdf, exportSectionsAsTxt } from '@/utils/studentExport';
import lthLogo from '@/assets/lth-logo.png';

const StudentPlanning = () => {
  const { programs } = usePrograms();
  const { toast } = useToast();

  const initial = useMemo(() => loadStudentPlan(), []);
  const [hydrated, setHydrated] = useState(false);
  const [studentName, setStudentName] = useState(initial?.studentName ?? '');
  const [program, setProgram] = useState<string>(initial?.program ?? '');
  const [actionPlan, setActionPlan] = useState<StudentActionPlanItem[]>(initial?.actionPlan ?? []);
  const [studyPlanText, setStudyPlanText] = useState(initial?.studyPlanText ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [aiDraft, setAiDraft] = useState(initial?.aiDraft ?? '');
  const [aiMode, setAiMode] = useState<'meeting-notes' | 'summary' | 'email-draft'>(initial?.aiMode ?? 'meeting-notes');
  const [aiStyleTemplate, setAiStyleTemplate] = useState<'short' | 'standard' | 'detailed'>(initial?.aiStyleTemplate ?? 'standard');
  const [aiPreviewTab, setAiPreviewTab] = useState<'preview' | 'edit'>(initial?.aiPreviewTab ?? 'preview');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [alsoClearProfile, setAlsoClearProfile] = useState(false);
  const [exportPayload, setExportPayload] = useState<{
    sections: DocSection[]; documentName: string; fileBaseName: string;
  } | null>(null);

  useEffect(() => { setHydrated(true); }, []);

  const savedAt = useDebouncedStudentPlanSave(
    { studentName, program, actionPlan, studyPlanText, notes, aiDraft, aiMode, aiStyleTemplate, aiPreviewTab },
    hydrated,
  );

  // Undo history for the course action plan (max 20 steps).
  const historyRef = useRef<StudentActionPlanItem[][]>([]);
  const [undoTick, setUndoTick] = useState(0);
  const pushHistory = (snapshot: StudentActionPlanItem[]) => {
    historyRef.current = [...historyRef.current.slice(-19), snapshot];
    setUndoTick((t) => t + 1);
  };
  const applyPlan = useCallback(
    (updater: React.SetStateAction<StudentActionPlanItem[]>) => {
      setActionPlan((prev) => {
        const next = typeof updater === 'function'
          ? (updater as (p: StudentActionPlanItem[]) => StudentActionPlanItem[])(prev)
          : updater;
        // Skip pushing history when the plan is unchanged (avoids no-op undo entries).
        if (JSON.stringify(next) !== JSON.stringify(prev)) pushHistory(prev);
        return next;
      });
    },
    [],
  );
  const undo = useCallback(() => {
    const last = historyRef.current[historyRef.current.length - 1];
    if (!last) return;
    historyRef.current = historyRef.current.slice(0, -1);
    setActionPlan(last);
    setUndoTick((t) => t + 1);
    toast({ title: 'Ångrade senaste ändring' });
  }, [toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z' || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || t?.isContentEditable) return;
      e.preventDefault();
      undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  // Auto-clear the `isExample` flag as soon as a user edits a row (name/hp/etc.)
  const setActionPlanTracked: React.Dispatch<React.SetStateAction<ActionPlanItem[]>> = (updater) => {
    applyPlan((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: ActionPlanItem[]) => ActionPlanItem[])(prev) : updater;
      const prevById = new Map(prev.map((it) => [it.id, it as StudentActionPlanItem]));
      return next.map((it) => {
        const before = prevById.get(it.id);
        if (!before?.isExample) return it as StudentActionPlanItem;
        const changed =
          before.code !== it.code || before.name !== it.name || before.hp !== it.hp ||
          before.studyPace !== it.studyPace || before.term !== it.term || before.placement !== it.placement;
        return changed ? { ...(it as StudentActionPlanItem), isExample: false } : (it as StudentActionPlanItem);
      });
    });
  };

  const exampleCount = actionPlan.filter((it) => it.isExample).length;
  const clearExamples = () => {
    applyPlan((prev) => prev.filter((it) => !it.isExample));
    toast({ title: 'Exempelkurser borttagna', description: `${exampleCount} rad(er) rensades.` });
  };

  const resetPlan = () => {
    applyPlan(() => []);
    setStudyPlanText('');
    setNotes('');
    setAiDraft('');
    setAiMode('meeting-notes');
    if (alsoClearProfile) {
      setStudentName('');
      setProgram('');
    }
    clearStudentPlan();
    setResetOpen(false);
    setAlsoClearProfile(false);
    toast({ title: 'Planen är återställd', description: 'Du kan börja om från början.' });
  };

  const appendAiToNotes = () => {
    if (!aiDraft.trim()) return;
    const stamp = new Date().toLocaleString('sv-SE');
    setStudyPlanText((prev) => (prev ? `${prev}\n\n— ${stamp} —\n${aiDraft}` : `— ${stamp} —\n${aiDraft}`));
    toast({ title: 'Tillagt', description: 'AI-texten är tillagd i dina studieplaneringsanteckningar.' });
  };

  const buildPayload = () => {
    const sections: DocSection[] = [];
    if (actionPlan.length > 0) {
      sections.push({
        type: 'table',
        heading: 'Mina kurser',
        columns: ['Kurskod', 'Namn', 'HP', 'Studietakt', 'Termin', 'Period'],
        rows: actionPlan.map((it) => [
          it.code, it.name, String(it.hp),
          `${it.studyPace ?? 100}%`, it.term, it.placement,
        ]),
      });
    }
    if (studyPlanText.trim()) {
      sections.push({ type: 'paragraph', heading: 'Anteckningar', body: studyPlanText });
    }
    if (aiDraft.trim()) {
      const label = aiMode === 'email-draft' ? 'Mailutkast' : aiMode === 'summary' ? 'Sammanställning' : 'Minnesanteckning';
      sections.push({ type: 'paragraph', heading: label, body: aiDraft });
    }
    const safe = (studentName || 'student').replace(/[^a-zA-Z0-9_-]/g, '_');
    const today = new Date().toISOString().slice(0, 10);
    return {
      sections,
      fileBaseName: `Studieplanering_${safe}_${today}`,
      today,
    };
  };

  const notifyEmpty = () => {
    toast({
      title: 'Inget att exportera',
      description: 'Lägg till minst en kurs eller skriv anteckningar först.',
      variant: 'destructive',
    });
  };

  const handleExportWord = () => {
    const p = buildPayload();
    if (p.sections.length === 0) return notifyEmpty();
    setExportPayload({
      sections: p.sections,
      documentName: 'Min studieplanering',
      fileBaseName: p.fileBaseName,
    });
  };

  const handleExportPdf = () => {
    const p = buildPayload();
    if (p.sections.length === 0) return notifyEmpty();
    const programName = programs.find((x) => x.code === program)?.name;
    exportSectionsAsPdf(p.sections, p.fileBaseName, {
      title: 'Min studieplanering',
      studentName: studentName || undefined,
      program: programName ? `${program} – ${programName}` : program || undefined,
      date: p.today,
    });
    toast({ title: 'PDF exporterad', description: `${p.fileBaseName}.pdf` });
  };

  const handleExportTxt = () => {
    const p = buildPayload();
    if (p.sections.length === 0) return notifyEmpty();
    const programName = programs.find((x) => x.code === program)?.name;
    exportSectionsAsTxt(p.sections, p.fileBaseName, {
      title: 'Min studieplanering',
      studentName: studentName || undefined,
      program: programName ? `${program} – ${programName}` : program || undefined,
      date: p.today,
    });
    toast({ title: 'Textfil exporterad', description: `${p.fileBaseName}.txt` });
  };

  const loadExamplePlan = () => {
    // Pick first available program if none chosen
    if (!program && programs.length > 0) setProgram(programs[0].code);
    const id = () => Math.random().toString(36).slice(2, 9);
    const example: StudentActionPlanItem[] = [
      { id: id(), code: 'EXEM01', name: 'Exempelkurs – Matematik',      hp: 7.5, periods: ['1'], term: 'HT2026', placement: 'LP1', studyPace: 100, isCustom: true, isExample: true },
      { id: id(), code: 'EXEM02', name: 'Exempelkurs – Programmering',  hp: 7.5, periods: ['1'], term: 'HT2026', placement: 'LP1', studyPace: 100, isCustom: true, isExample: true },
      { id: id(), code: 'EXEM03', name: 'Exempelkurs – Fysik',          hp: 7.5, periods: ['2'], term: 'HT2026', placement: 'LP2', studyPace: 100, isCustom: true, isExample: true },
      { id: id(), code: 'EXEM04', name: 'Exempelkurs – Statistik',      hp: 7.5, periods: ['2'], term: 'HT2026', placement: 'LP2', studyPace: 100, isCustom: true, isExample: true },
      { id: id(), code: 'EXEM05', name: 'Exempelkurs – Linjär algebra', hp: 7.5, periods: ['3'], term: 'VT2027', placement: 'LP3', studyPace: 100, isCustom: true, isExample: true },
      { id: id(), code: 'EXEM06', name: 'Exempelkurs – Datastrukturer', hp: 7.5, periods: ['3'], term: 'VT2027', placement: 'LP3', studyPace: 100, isCustom: true, isExample: true },
      { id: id(), code: 'EXEM07', name: 'Exempelkurs – Databasteknik',  hp: 7.5, periods: ['4'], term: 'VT2027', placement: 'LP4', studyPace: 100, isCustom: true, isExample: true },
      { id: id(), code: 'EXEM08', name: 'Exempelkurs – Projekt',        hp: 7.5, periods: ['4'], term: 'VT2027', placement: 'LP4', studyPace: 100, isCustom: true, isExample: true },
    ];
    applyPlan(() => example);
    setStudyPlanText(
      'Exempelplan: två terminer med 30 hp per termin (100% studietakt).\n' +
      '• HT2026: LP1 och LP2, 15 hp per läsperiod\n' +
      '• VT2027: LP3 och LP4, 15 hp per läsperiod\n\n' +
      'Byt ut exempelkurserna mot dina riktiga kurser via "Lägg till kurs".',
    );
    toast({ title: 'Exempelplan inläst', description: 'Redigera eller ersätt kurserna för att göra planen till din egen.' });
  };

  return (
    <div className="fixed inset-0 bg-background flex">
      {/* Sidebar */}
      <aside className="w-16 shrink-0 bg-secondary/40 border-r flex flex-col items-center py-3 gap-2">
        <div className="w-10 h-10 rounded-md bg-white border flex items-center justify-center mb-2">
          <img src={lthLogo} alt="LTH" className="max-w-[32px] max-h-[32px]" />
        </div>
        <button className="w-10 h-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center" title="Studieplanering">
          <GraduationCap className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowOnboarding(true)}
          className="w-10 h-10 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-center"
          title="Hjälp / guide"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <Link to="/" className="w-10 h-10 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-center" title="Till startsidan">
          <Home className="w-5 h-5" />
        </Link>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b bg-card px-6 py-3 shrink-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-lg font-bold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" /> Min studieplanering
              </h1>
              <p className="text-xs text-muted-foreground">Planera dina kurser själv – utan inloggning. Din data sparas endast lokalt i denna webbläsare.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {savedAt && (
                <span className="text-[11px] text-muted-foreground hidden md:inline">
                  Sparat {new Date(savedAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <div className="flex items-center gap-2">
                <Label htmlFor="stud-name" className="text-xs text-muted-foreground">Ditt namn</Label>
                <Input
                  id="stud-name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Förnamn Efternamn"
                  className="h-9 w-52 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Program</Label>
                <Select value={program} onValueChange={setProgram}>
                  <SelectTrigger className="h-9 w-48 text-sm">
                    <SelectValue placeholder="Välj program" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.code}>{p.code} – {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {!program ? (
            <div className="max-w-2xl mx-auto mt-16 border rounded-lg p-8 bg-card text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Välj ditt program för att komma igång</h2>
              <p className="text-sm text-muted-foreground">
                När du har valt program ovan laddas alla kurser du kan välja mellan. Du kan sedan lägga till dem i respektive termin och läsperiod.
              </p>
              <div className="flex items-start gap-2 text-left bg-muted/30 border rounded p-3 text-xs text-muted-foreground">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Ingen inloggning krävs. Din studieplanering sparas endast i din webbläsare och kan när som helst exporteras som Word-dokument.</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" onClick={() => setShowOnboarding(true)}>
                  <ListChecks className="w-4 h-4 mr-1" /> Visa guide igen
                </Button>
                <Button variant="secondary" onClick={loadExamplePlan}>
                  <Wand2 className="w-4 h-4 mr-1" /> Ladda exempelplan
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto">
              <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={undo}
                disabled={historyRef.current.length === 0}
                title="Ångra senaste ändring (Ctrl/Cmd+Z)"
              >
                <Undo2 className="w-4 h-4 mr-1" /> Ångra
              </Button>
                  {exampleCount > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded px-2 py-1 text-xs">
                      <Info className="w-3.5 h-3.5" />
                      <span>{exampleCount} exempelkurs{exampleCount === 1 ? '' : 'er'} kvar – redigera eller ta bort.</span>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-amber-900 hover:bg-amber-100" onClick={clearExamples}>
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Rensa exempel
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <RotateCcw className="w-4 h-4 mr-1" /> Återställ plan
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Återställa hela planen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Alla kurser, anteckningar och AI-utkast rensas. Detta kan inte ångras.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={alsoClearProfile} onCheckedChange={(v) => setAlsoClearProfile(v === true)} />
                      Rensa även namn och program
                    </label>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction onClick={resetPlan}>Ja, återställ</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <FileDown className="w-4 h-4 mr-1" /> Exportera sammanställning
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover z-50">
                    <DropdownMenuLabel>Välj format</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportWord}>
                      <FileText className="w-4 h-4 mr-2" /> Word-dokument (.docx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPdf}>
                      <FileType2 className="w-4 h-4 mr-2" /> PDF (.pdf)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportTxt}>
                      <FileText className="w-4 h-4 mr-2" /> Textfil (.txt)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              </div>
              <StudyPlanCanvas
                program={program}
                actionPlan={actionPlan}
                setActionPlan={setActionPlanTracked}
                studyPlanText={studyPlanText}
                setStudyPlanText={setStudyPlanText}
                onExport={handleExportWord}
              />

              <div className="mt-6">
                <StudentAiPanel
                  studentName={studentName}
                  program={program}
                  actionPlan={actionPlan}
                  notes={notes}
                  setNotes={setNotes}
                  aiDraft={aiDraft}
                  setAiDraft={setAiDraft}
                  aiMode={aiMode}
                  setAiMode={setAiMode}
                  onAppendToNotes={appendAiToNotes}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      <StudentOnboarding
        forceOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onLoadExample={loadExamplePlan}
      />

      {exportPayload && (
        <ExportPreviewDialog
          open={!!exportPayload}
          onClose={() => setExportPayload(null)}
          documentName={exportPayload.documentName}
          fileBaseName={exportPayload.fileBaseName}
          counselorName={studentName}
          date={new Date().toISOString().slice(0, 10)}
          sections={exportPayload.sections}
        />
      )}
    </div>
  );
};

export default StudentPlanning;