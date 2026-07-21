import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  GraduationCap, Home, ListChecks, Info, HelpCircle, FileText, FileType2, FileDown, Wand2,
} from 'lucide-react';
import { StudyPlanCanvas, ActionPlanItem } from '@/components/meeting/StudyPlanCanvas';
import { ExportPreviewDialog, DocSection } from '@/components/export/ExportPreviewDialog';
import { StudentOnboarding } from '@/components/student/StudentOnboarding';
import { usePrograms } from '@/hooks/usePrograms';
import { useToast } from '@/hooks/use-toast';
import { exportSectionsAsPdf, exportSectionsAsTxt } from '@/utils/studentExport';
import lthLogo from '@/assets/lth-logo.png';

const StudentPlanning = () => {
  const { programs } = usePrograms();
  const { toast } = useToast();

  const [studentName, setStudentName] = useState('');
  const [program, setProgram] = useState<string>('');
  const [actionPlan, setActionPlan] = useState<ActionPlanItem[]>([]);
  const [studyPlanText, setStudyPlanText] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [exportPayload, setExportPayload] = useState<{
    sections: DocSection[]; documentName: string; fileBaseName: string;
  } | null>(null);

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
    const example: ActionPlanItem[] = [
      { id: id(), code: 'EXEM01', name: 'Exempelkurs – Matematik',      hp: 7.5, periods: ['1'], term: 'HT2026', placement: 'LP1', studyPace: 100, isCustom: true },
      { id: id(), code: 'EXEM02', name: 'Exempelkurs – Programmering',  hp: 7.5, periods: ['1'], term: 'HT2026', placement: 'LP1', studyPace: 100, isCustom: true },
      { id: id(), code: 'EXEM03', name: 'Exempelkurs – Fysik',          hp: 7.5, periods: ['2'], term: 'HT2026', placement: 'LP2', studyPace: 100, isCustom: true },
      { id: id(), code: 'EXEM04', name: 'Exempelkurs – Statistik',      hp: 7.5, periods: ['2'], term: 'HT2026', placement: 'LP2', studyPace: 100, isCustom: true },
      { id: id(), code: 'EXEM05', name: 'Exempelkurs – Linjär algebra', hp: 7.5, periods: ['3'], term: 'VT2027', placement: 'LP3', studyPace: 100, isCustom: true },
      { id: id(), code: 'EXEM06', name: 'Exempelkurs – Datastrukturer', hp: 7.5, periods: ['3'], term: 'VT2027', placement: 'LP3', studyPace: 100, isCustom: true },
      { id: id(), code: 'EXEM07', name: 'Exempelkurs – Databasteknik',  hp: 7.5, periods: ['4'], term: 'VT2027', placement: 'LP4', studyPace: 100, isCustom: true },
      { id: id(), code: 'EXEM08', name: 'Exempelkurs – Projekt',        hp: 7.5, periods: ['4'], term: 'VT2027', placement: 'LP4', studyPace: 100, isCustom: true },
    ];
    setActionPlan(example);
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
              <div className="mb-3 flex justify-end">
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
              <StudyPlanCanvas
                program={program}
                actionPlan={actionPlan}
                setActionPlan={setActionPlan}
                studyPlanText={studyPlanText}
                setStudyPlanText={setStudyPlanText}
                onExport={handleExportWord}
              />
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