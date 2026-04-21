import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles, Loader2, Download, Save, FileText, User, Upload, FileImage,
  X, Mail, ClipboardList, Copy, Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import { COUNSELORS } from '@/types/planning';
import {
  buildGovHeader, buildGovFooter, buildGovTitle, loadLogoBuffer,
  GOV_PAGE_PROPS, GOV_SANS, GOV_ACCENT,
} from '@/utils/wordTemplate';

const programs = [
  { value: 'D', label: 'Datateknik (D)' },
  { value: 'C', label: 'Infocom (C)' },
];

const generateYearGroups = () => {
  const groups: string[] = [];
  for (let year = 15; year <= 30; year++) {
    groups.push(`D${year}`, `C${year}`);
  }
  return groups.sort();
};
const yearGroups = generateYearGroups();

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

/** Parse a line and return TextRun[] preserving bold from **...** segments. */
function parseRuns(line: string, baseOpts: any): TextRun[] {
  const cleaned = line
    .replace(/^#+\s*/, '')
    .replace(/^>\s*/, '')
    .replace(/^"(.+)"$/, '$1');
  const parts = cleaned.split(/(\*\*.+?\*\*|__.+?__)/g).filter(p => p !== '');
  if (parts.length === 0) return [new TextRun({ text: '', ...baseOpts })];
  return parts.map(p => {
    if ((p.startsWith('**') && p.endsWith('**')) || (p.startsWith('__') && p.endsWith('__'))) {
      return new TextRun({ text: p.slice(2, -2), bold: true, ...baseOpts });
    }
    return new TextRun({ text: p, ...baseOpts });
  });
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

  // Section A — Grundinformation
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [studentName, setStudentName] = useState('');
  const [program, setProgram] = useState('D');
  const [yearGroup, setYearGroup] = useState('');
  const [counselor, setCounselor] = useState('');

  // Section B — Material
  const [textInput, setTextInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Section C/D — AI + result
  const [activeMode, setActiveMode] = useState<'meeting-notes' | 'summary' | 'email-draft'>('meeting-notes');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

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

    let result = '';
    try {
      await streamResponse(
        {
          mode,
          content: content || undefined,
          images: images.length > 0 ? images : undefined,
          studentInfo,
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

    const FONT = GOV_SANS;
    const lines = generatedText.split('\n');
    const paragraphs: Paragraph[] = [];

    // Title block
    buildGovTitle().forEach((p) => paragraphs.push(p));

    // Subtitle for the document type
    const subtitle =
      activeMode === 'email-draft' ? 'Mailutkast'
        : activeMode === 'summary' ? 'Sammanställning'
        : 'Minnesanteckning';
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: subtitle, bold: true, size: 24, font: FONT, color: GOV_ACCENT })],
        spacing: { after: 240 },
      }),
    );

    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, '');
      const trimmed = line.trim();
      if (trimmed === '---' || trimmed === '___') continue;

      // Skip duplicate MINNESANTECKNING titles in body
      if (/^#?\s*MINNESANTECKNING\b/i.test(trimmed)) continue;

      // Markdown table separator skip
      if (/^\|?\s*[-:]+(\s*\|\s*[-:]+)+\s*\|?$/.test(trimmed)) continue;

      // Bullet
      if (/^[-*]\s+/.test(trimmed)) {
        const text = trimmed.replace(/^[-*]\s+/, '');
        paragraphs.push(new Paragraph({
          children: parseRuns(text, { size: 22, font: FONT }),
          bullet: { level: 0 },
          spacing: { after: 60 },
        }));
        continue;
      }

      // Numbered list
      if (/^\d+[.)]\s+/.test(trimmed)) {
        paragraphs.push(new Paragraph({
          children: parseRuns(trimmed, { size: 22, font: FONT }),
          spacing: { after: 60 },
          indent: { left: 360 },
        }));
        continue;
      }

      // Heading - markdown #
      if (/^#{1,3}\s+/.test(trimmed)) {
        const level = (trimmed.match(/^#+/)?.[0].length ?? 1);
        const text = trimmed.replace(/^#+\s+/, '').replace(/^"(.+)"$/, '$1');
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text, bold: true, size: level === 1 ? 28 : 24, font: FONT, color: GOV_ACCENT })],
          heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        }));
        continue;
      }

      // Heading - keyword line
      if (trimmed && isHeading(trimmed) && trimmed.length < 60 && !trimmed.includes(',')) {
        const text = cleanLine(trimmed).replace(/:$/, '');
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text, bold: true, size: 24, font: FONT, color: GOV_ACCENT })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }));
        continue;
      }

      // Empty line
      if (!trimmed) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 80 } }));
        continue;
      }

      // Body
      paragraphs.push(new Paragraph({
        children: parseRuns(trimmed, { size: 22, font: FONT }),
        spacing: { after: 100 },
      }));
    }

    const info = buildStudentInfo();
    const counselorName = info.counselorName || 'Studievägledare';
    const logoBuffer = await loadLogoBuffer();

    const doc = new Document({
      styles: { default: { document: { run: { font: FONT, size: 22 } } } },
      numbering: {
        config: [{
          reference: 'bullets',
          levels: [{
            level: 0, format: 'bullet' as any, text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        }],
      },
      sections: [{
        properties: GOV_PAGE_PROPS,
        children: paragraphs,
        headers: { default: buildGovHeader({ counselorName, date: info.formattedDate }, logoBuffer) },
        footers: { default: buildGovFooter() },
      }],
    });

    const blob = await Packer.toBlob(doc);
    const safeName = (studentName || 'student').replace(/[^a-zA-Z0-9_-]/g, '_');
    saveAs(blob, `Minnesanteckning_${safeName}_${datum}.docx`);
    toast({ title: 'Nedladdad!', description: 'Word-dokumentet har sparats.' });
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
        </CardContent>
      </Card>

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generera med AI
          </CardTitle>
          <CardDescription>
            Välj vilken typ av text du vill skapa baserat på materialet.
          </CardDescription>
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
    </div>
  );
};
