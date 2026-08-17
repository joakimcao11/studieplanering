import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles, Loader2, Download, Save, FileText, User, Upload, FileImage,
  X, Mail, ClipboardList, Copy, Check, ListChecks, CalendarDays,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { COUNSELORS } from '@/types/planning';
import { StudyPlanCanvas, ActionPlanItem, SupplementItem } from './meeting/StudyPlanCanvas';
import { ExportPreviewDialog, DocSection } from './export/ExportPreviewDialog';
import { usePrograms } from '@/hooks/usePrograms';

const FALLBACK_PROGRAMS = [
  { value: 'D', label: 'Datateknik (D)' },
  { value: 'C', label: 'Infocom (C)' },
];

interface UploadedFile {
  name: string;
  type: string;
  base64: string;
  preview?: string;
}

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`;

async function streamResponse(
  body: object,
  onDelta: (text: string) => void,
  onDone: () => void,
) {
  const resp = await fetch(ANALYZE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Okänt fel' }));
    throw new Error(err.error || `Fel: ${resp.status}`);
  }
  if (!resp.body) throw new Error('Ingen stream tillgänglig');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nlIdx: number;
    while ((nlIdx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, nlIdx);
      buffer = buffer.slice(nlIdx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* partial json */ }
    }
  }
  onDone();
}

/** Strip markdown noise: **, __, *, _, leading #, leading >, surrounding ". */
function cleanLine(line: string): string {
  return line
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '$1')
    .replace(/^#+\s*/, '')
    .replace(/^>\s*/, '')
    .replace(/^"(.+)"$/, '$1')
    .trim();
}

const HEADING_KEYWORDS = [
  'datum', 'student', 'studievägledare', 'program', 'årskull',
  'bakgrund', 'diskussion', 'sammanfattning', 'minnesanteckning',
  'handlingsplan', 'nästa steg', 'reflektion', 'rekommendation',
  'studieplanering', 'kurser', 'mål', 'tema', 'analys', 'översikt',
];

function isHeading(line: string): boolean {
  const lower = line.toLowerCase().trim();
  if (lower.endsWith(':')) return true;
  return HEADING_KEYWORDS.some(k => lower === k || lower.startsWith(k + ':') || lower === k);
}

export const MeetingNotesTab = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { programs: dbPrograms } = usePrograms();

  const programs = dbPrograms.length > 0
    ? dbPrograms.map((p) => ({ value: p.code, label: `${p.name} (${p.code})` }))
    : FALLBACK_PROGRAMS;

  const yearGroups = (() => {
    const codes = programs.map((p) => p.value);
    const groups: string[] = [];
    codes.forEach((code) => {
      for (let year = 15; year <= 30; year++) groups.push(`${code}${year}`);
    });
    return groups.sort();
  })();

  // Section A — Grundinformation
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [studentName, setStudentName] = useState('');
  const [program, setProgram] = useState('D');
  const [yearGroup, setYearGroup] = useState('');
  const [counselor, setCounselor] = useState('');
  const [agenda, setAgenda] = useState('');

  // Section B — Material
  const [textInput, setTextInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Section C/D — AI + result
  const [activeMode, setActiveMode] = useState<'meeting-notes' | 'summary' | 'email-draft'>('meeting-notes');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handlingsplan
  const [actionPlan, setActionPlan] = useState<ActionPlanItem[]>([]);
  const [studyPlanText, setStudyPlanText] = useState('');
  const [supplements, setSupplements] = useState<SupplementItem[]>([]);
  const [aiOpen, setAiOpen] = useState(false);

  const handleResetPlan = () => {
    if (!window.confirm('Vill du återställa studieplaneringen? Kurser, komplettering och textplanering rensas.')) return;
    setActionPlan([]);
    setSupplements([]);
    setStudyPlanText('');
    toast({ title: 'Planen är återställd' });
  };

  const supplementSection = (): DocSection | null => {
    if (supplements.length === 0) return null;
    return {
      type: 'table',
      heading: 'Komplettering',
      columns: ['Typ', 'Kurs', 'Vad saknas', 'Termin', 'Läsperiod', 'Status'],
      rows: supplements.map((s) => [
        s.type, s.courseCode, s.description, s.term, s.placement, s.done ? 'Klar' : 'Kvarstår',
      ]),
    };
  };

  // Export preview dialog state
  const [exportPayload, setExportPayload] = useState<{
    sections: DocSection[];
    documentName: string;
    fileBaseName: string;
  } | null>(null);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    const maxSize = 10 * 1024 * 1024;
    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        toast({ title: 'För stor fil', description: `${file.name} är större än 10 MB`, variant: 'destructive' });
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setUploadedFiles((prev) => [...prev, {
          name: file.name, type: file.type, base64,
          preview: file.type.startsWith('image/') ? base64 : undefined,
        }]);
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const removeFile = (index: number) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const buildStudentInfo = () => {
    const selectedCounselor = COUNSELORS.find((c) => c.id === counselor);
    return {
      date: datum,
      formattedDate: new Date(datum).toLocaleDateString('sv-SE'),
      studentName: studentName || '',
      program,
      yearGroup: yearGroup || '',
      counselorName: selectedCounselor?.name || '',
    };
  };

  const handleGenerate = async (mode: 'meeting-notes' | 'summary' | 'email-draft') => {
    if (!textInput.trim() && uploadedFiles.length === 0) {
      toast({ title: 'Inget material', description: 'Ladda upp filer eller klistra in text först.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    setActiveMode(mode);
    setIsSaved(false);
    setGeneratedText('');

    const images = uploadedFiles.filter((f) => f.type.startsWith('image/')).map((f) => f.base64);
    const nonImageFiles = uploadedFiles.filter((f) => !f.type.startsWith('image/'));
    let content = textInput;
    if (nonImageFiles.length > 0) {
      content += (content ? '\n\n' : '') + '[Uppladdade dokument: ' + nonImageFiles.map((f) => f.name).join(', ') + ']';
    }

    const studentInfo = buildStudentInfo();
    const studentInfoFull = { ...studentInfo, agenda, actionPlan, studyPlanText, supplements };

    let result = '';
    try {
      await streamResponse(
        {
          mode,
          content: content || undefined,
          images: images.length > 0 ? images : undefined,
          studentInfo: studentInfoFull,
        },
        (delta) => { result += delta; setGeneratedText(result); },
        () => {},
      );
      toast({ title: 'Klart!', description: 'AI-text genererad.' });
    } catch (err: any) {
      toast({ title: 'Fel vid generering', description: err.message || 'Försök igen.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    toast({ title: 'Sparat!', description: 'Dina ändringar har sparats.' });
  };

  const handleCopy = async () => {
    const cleaned = generatedText.split('\n').map(cleanLine).join('\n');
    await navigator.clipboard.writeText(cleaned);
    setCopied(true);
    toast({ title: 'Kopierat', description: 'Texten har kopierats till urklipp.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportWord = async () => {
    if (!generatedText.trim()) {
      toast({ title: 'Inget att exportera', description: 'Generera text först.', variant: 'destructive' });
      return;
    }
    const sections: DocSection[] = [];
    if (agenda.trim()) sections.push({ type: 'paragraph', heading: 'Agenda', body: agenda });
    if (actionPlan.length > 0) {
      sections.push({
        type: 'table',
        heading: 'Handlingsplan – kurser',
        columns: ['Kurskod', 'Namn', 'HP', 'Studietakt', 'Termin', 'Period'],
        rows: actionPlan.map((it) => [
          it.code, it.name, String(it.hp),
          `${it.studyPace ?? 100}%`, it.term, it.placement,
        ]),
      });
    }
    const suppA = supplementSection();
    if (suppA) sections.push(suppA);
    sections.push({
      type: 'paragraph',
      heading: activeMode === 'email-draft' ? 'Mailutkast' : activeMode === 'summary' ? 'Sammanställning' : 'Minnesanteckning',
      body: generatedText.split('\n').map(cleanLine).join('\n'),
    });
    const safeName = (studentName || 'student').replace(/[^a-zA-Z0-9_-]/g, '_');
    setExportPayload({
      sections,
      documentName:
        activeMode === 'email-draft' ? 'Mailutkast'
          : activeMode === 'summary' ? 'Sammanställning'
          : 'Minnesanteckning',
      fileBaseName: `Minnesanteckning_${safeName}_${datum}`,
    });
  };

  const handleExportStudyPlan = () => {
    const sections: DocSection[] = [];
    if (actionPlan.length > 0) {
      sections.push({
        type: 'table',
        heading: 'Handlingsplan – kurser',
        columns: ['Kurskod', 'Namn', 'HP', 'Studietakt', 'Termin', 'Period'],
        rows: actionPlan.map((it) => [
          it.code, it.name, String(it.hp),
          `${it.studyPace ?? 100}%`, it.term, it.placement,
        ]),
      });
    }
    const supp = supplementSection();
    if (supp) sections.push(supp);
    if (studyPlanText.trim()) {
      sections.push({ type: 'paragraph', heading: 'Studieplanering', body: studyPlanText });
    }
    if (sections.length === 0) {
      toast({ title: 'Inget att exportera', description: 'Lägg till kurser i handlingsplanen eller skriv textplanering först.', variant: 'destructive' });
      return;
    }
    const safeName = (studentName || 'student').replace(/[^a-zA-Z0-9_-]/g, '_');
    setExportPayload({
      sections,
      documentName: 'Studieplanering',
      fileBaseName: `Studieplanering_${safeName}_${datum}`,
    });
  };

  const filteredYears = yearGroups.filter((g) => g.startsWith(program));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Section A — Grundinformation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Grundinformation
          </CardTitle>
          <CardDescription>
            Datum och studentuppgifter används i sidhuvudet på det exporterade Word-dokumentet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Datum</Label>
            <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} className="max-w-xs" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Studentens namn</Label>
              <Input placeholder="Förnamn Efternamn" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Program</Label>
              <Select value={program} onValueChange={(v) => { setProgram(v); setYearGroup(''); }}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  {programs.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Årskull</Label>
              <Select value={yearGroup} onValueChange={setYearGroup}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Välj årskull" /></SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  {filteredYears.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Studievägledare</Label>
              <Select value={counselor} onValueChange={setCounselor}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Välj studievägledare" /></SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  {COUNSELORS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> Agenda
            </Label>
            <p className="text-xs text-muted-foreground">Skriv löpande text och/eller punktlista (t.ex. <code>- punkt</code>).</p>
            <Textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder={'- Återkoppling sedan förra samtalet\n- Studieplan HT2026 / VT2027\n- Nästa steg'}
              className="min-h-[100px] text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stöd i studieplanering */}
      <StudyPlanCanvas
        program={program}
        variant="counselor"
        supplements={supplements}
        setSupplements={setSupplements}
        actionPlan={actionPlan}
        setActionPlan={setActionPlan}
        studyPlanText={studyPlanText}
        setStudyPlanText={setStudyPlanText}
        onExport={handleExportStudyPlan}
        onReset={handleResetPlan}
      />

      {/* Section B — Ladda upp material */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Ladda upp material
          </CardTitle>
          <CardDescription>
            Bilder (t.ex. whiteboard), PDF, Word-dokument och/eller fritext.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <FileImage className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Dra och släpp filer här, eller klicka för att välja</p>
            <p className="text-xs text-muted-foreground mt-1">Bilder, PDF, Word (max 10 MB per fil)</p>
            <Input
              ref={fileInputRef} type="file" multiple
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>

          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 text-sm">
                  {file.preview
                    ? <img src={file.preview} alt="" className="w-8 h-8 object-cover rounded" />
                    : <FileText className="w-4 h-4 text-muted-foreground" />}
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Anteckningar / klistra in text</Label>
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Skriv eller klistra in anteckningar från samtalet här..."
              className="min-h-[140px] text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section C — AI-knappar */}
      {!aiOpen ? (
        <div className="rounded-lg border border-dashed p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Generera med AI (extra funktion)
            </div>
            <p className="text-xs text-muted-foreground">
              Skapa minnesanteckning, sammanställning eller mailutkast utifrån materialet, planeringen och kompletteringarna.
            </p>
          </div>
          <Button variant="outline" onClick={() => setAiOpen(true)}>
            <Sparkles className="w-4 h-4 mr-2" /> Öppna AI-stöd
          </Button>
        </div>
      ) : (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Generera med AI
              </CardTitle>
              <CardDescription>
                Välj vilken typ av text du vill skapa baserat på materialet.
              </CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setAiOpen(false)}>Dölj</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleGenerate('meeting-notes')}
              disabled={isGenerating}
              className="flex-1 min-w-[200px]"
              size="lg"
            >
              {isGenerating && activeMode === 'meeting-notes' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Genererar...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generera minnesanteckning</>
              )}
            </Button>
            <Button
              onClick={() => handleGenerate('summary')}
              disabled={isGenerating}
              variant="secondary"
              className="flex-1 min-w-[200px]"
              size="lg"
            >
              {isGenerating && activeMode === 'summary' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sammanställer...</>
              ) : (
                <><ClipboardList className="w-4 h-4 mr-2" />Skapa sammanställning</>
              )}
            </Button>
            <Button
              onClick={() => handleGenerate('email-draft')}
              disabled={isGenerating}
              variant="outline"
              className="flex-1 min-w-[200px]"
              size="lg"
            >
              {isGenerating && activeMode === 'email-draft' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Genererar...</>
              ) : (
                <><Mail className="w-4 h-4 mr-2" />Generera mailutkast</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Section D — Resultat */}
      {generatedText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {activeMode === 'email-draft' ? 'Mailutkast'
                : activeMode === 'summary' ? 'Sammanställning'
                : 'Genererad minnesanteckning'}
            </CardTitle>
            <CardDescription>
              Redigera texten nedan vid behov, spara ändringar och ladda ner som Word-dokument.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={generatedText}
              onChange={(e) => { setGeneratedText(e.target.value); setIsSaved(false); }}
              className="min-h-[400px] text-sm font-mono"
            />
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleCopy} variant="outline" className="flex-1 min-w-[150px]">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Kopierat' : 'Kopiera'}
              </Button>
              <Button onClick={handleSave} variant="outline" className="flex-1 min-w-[150px]">
                <Save className="w-4 h-4 mr-2" />
                {isSaved ? '✓ Sparat' : 'Spara ändringar'}
              </Button>
              <Button onClick={handleExportWord} className="flex-1 min-w-[200px]">
                <Download className="w-4 h-4 mr-2" />
                Exportera som Word-dokument
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stöd i studieplanering — längst ner */}
      <StudyPlanCanvas
        program={program}
        variant="counselor"
        supplements={supplements}
        setSupplements={setSupplements}
        actionPlan={actionPlan}
        setActionPlan={setActionPlan}
        studyPlanText={studyPlanText}
        setStudyPlanText={setStudyPlanText}
        onExport={handleExportStudyPlan}
      />

      {/* Export-förhandsgranskning (LTH/LU-mall) */}
      {exportPayload && (
        <ExportPreviewDialog
          open={!!exportPayload}
          onClose={() => setExportPayload(null)}
          documentName={exportPayload.documentName}
          fileBaseName={exportPayload.fileBaseName}
          counselorName={COUNSELORS.find((c) => c.id === counselor)?.name || ''}
          date={datum}
          sections={exportPayload.sections}
        />
      )}
    </div>
  );
};
