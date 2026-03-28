import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Download, Save, FileText, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, Footer, PageNumber, TabStopType, TabStopPosition, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { COUNSELORS } from '@/types/planning';

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

export const TextToTextTab = () => {
  const [inputText, setInputText] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  // Grundinformation state
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [studentName, setStudentName] = useState('');
  const [program, setProgram] = useState('D');
  const [yearGroup, setYearGroup] = useState('');
  const [counselor, setCounselor] = useState('');

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast({ title: 'Skriv in text först', description: 'Fyll i textrutan med information om studentens studiesituation.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setIsSaved(false);

    try {
      const { data, error } = await supabase.functions.invoke('generate-study-notes', {
        body: { text: inputText },
      });

      if (error) throw error;

      if (data?.error) {
        toast({ title: 'Fel', description: data.error, variant: 'destructive' });
      } else {
        setGeneratedText(data.result);
        toast({ title: 'Klart!', description: 'Minnesanteckning genererad.' });
      }
    } catch (err) {
      console.error('Error generating notes:', err);
      toast({ title: 'Fel vid generering', description: 'Kunde inte generera minnesanteckning. Försök igen.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    toast({ title: 'Sparat!', description: 'Dina ändringar har sparats.' });
  };

  const handleExportWord = async () => {
    if (!generatedText.trim()) {
      toast({ title: 'Inget att exportera', description: 'Generera en minnesanteckning först.', variant: 'destructive' });
      return;
    }

    const FONT = 'Arial';
    const ACCENT = '2E75B6';
    const lines = generatedText.split('\n');
    const paragraphs: Paragraph[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '---') continue;

      if (trimmed.startsWith('MINNESANTECKNING') || trimmed.startsWith('# ')) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: trimmed.replace(/^#+\s*/, ''), bold: true, size: 30, font: FONT, color: ACCENT })],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 4 } },
        }));
      } else if (trimmed.startsWith('## ') || trimmed.match(/^(Datum|Student|Program|TERMIN|Läsperiod|Omtentor|Totalt|Planering|Studievägledare)/)) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: trimmed.replace(/^#+\s*/, ''), bold: true, size: 24, font: FONT })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }));
      } else if (trimmed.startsWith('- ')) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: trimmed.substring(2), size: 22, font: FONT })],
          bullet: { level: 0 },
          spacing: { after: 60 },
        }));
      } else if (trimmed) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: trimmed, size: 22, font: FONT })],
          spacing: { after: 80 },
        }));
      }
    }

    const selectedCounselor = COUNSELORS.find(c => c.id === counselor);
    const doc = new Document({
      styles: { default: { document: { run: { font: FONT, size: 22 } } } },
      numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: 'bullet' as any, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
      sections: [{
        properties: {
          page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        children: [
          new Paragraph({
            children: [new TextRun({ text: selectedCounselor?.name || 'Studievägledare', bold: true, size: 22, font: FONT })],
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [new TextRun({ text: selectedCounselor?.email || '', size: 20, font: FONT, color: '666666' })],
            spacing: { after: 300 },
          }),
          ...paragraphs,
          new Paragraph({
            children: [new TextRun({ text: `Genererat: ${new Date().toLocaleDateString('sv-SE')}`, size: 18, font: FONT, color: '999999', italics: true })],
            spacing: { before: 400 },
          }),
        ],
        footers: {
          default: new Footer({
            children: [new Paragraph({
              children: [
                new TextRun({ text: 'Studie- och karriärvägledningen LTH', size: 18, font: FONT, color: '888888' }),
                new TextRun({ text: '\t' }),
                new TextRun({ text: 'Sida ', size: 18, font: FONT, color: '888888' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, font: FONT, color: '888888' }),
              ],
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            })],
          }),
        },
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Minnesanteckning_${new Date().toISOString().slice(0, 10)}.docx`);
    toast({ title: 'Nedladdad!', description: 'Word-dokumentet har sparats.' });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Grundinformation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Grundinformation
          </CardTitle>
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
              <Select value={program} onValueChange={setProgram}>
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
                  {yearGroups.filter(g => g.startsWith(program)).map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Text till text – AI-stödd minnesanteckning
          </CardTitle>
          <CardDescription>
            Skriv in anteckningar från ett vägledningssamtal. AI:n strukturerar informationen till en tydlig minnesanteckning med kurskoder, HP och läsperioder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Dina anteckningar</label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='Exempel: "Idag den 260216 har jag haft ett samtal med David, D23, vi har pratat om en studieplan för Våren 2025, studenten ska läsa fotonik och Programmeringsteknik - fördjupningskurs. I omtentamen i april kommer han att fokusera på kursen FMAB70 och ska göra omtentan i den. Vi planerar att studenten kommer tillbaka innan läsperiod 4"'
              className="min-h-[200px] text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tips: Skriv kurskoder (t.ex. FAFA60) eller kursnamn – AI:n identifierar dem automatiskt från LTH:s kursdata.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !inputText.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Genererar minnesanteckning...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generera minnesanteckning
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Genererad minnesanteckning</CardTitle>
            <CardDescription>
              Redigera texten nedan vid behov, spara ändringar och ladda ner som Word-dokument.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={generatedText}
              onChange={(e) => {
                setGeneratedText(e.target.value);
                setIsSaved(false);
              }}
              className="min-h-[400px] text-sm font-mono"
            />

            <div className="flex gap-3">
              <Button onClick={handleSave} variant="outline" className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {isSaved ? '✓ Sparat' : 'Spara ändringar'}
              </Button>
              <Button onClick={handleExportWord} className="flex-1">
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
