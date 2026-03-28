import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Plus, Trash2, Edit2, Check, GraduationCap, BookOpen, User } from 'lucide-react';
import { SimpleStudentInfo, SimpleRestkurs, SimpleNyKurs } from '../SimplePlanningTab';
import { useState } from 'react';
import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, BorderStyle, Footer, PageNumber, TabStopType, TabStopPosition } from 'docx';
import { saveAs } from 'file-saver';

interface SimpleSummaryStepProps {
  studentInfo: SimpleStudentInfo;
  restkurser: SimpleRestkurs[];
  nyaKurser: SimpleNyKurs[];
  onUpdateRestkurs: (id: string, updates: Partial<SimpleRestkurs>) => void;
  onRemoveRestkurs: (id: string) => void;
  onAddRestkurs: () => void;
  onUpdateNyKurs: (id: string, updates: Partial<SimpleNyKurs>) => void;
  onRemoveNyKurs: (id: string) => void;
  onAddNyKurs: () => void;
}

export const SimpleSummaryStep = ({ 
  studentInfo, 
  restkurser, 
  nyaKurser,
  onUpdateRestkurs,
  onRemoveRestkurs,
  onAddRestkurs,
  onUpdateNyKurs,
  onRemoveNyKurs,
  onAddNyKurs
}: SimpleSummaryStepProps) => {
  const [editingRestkurs, setEditingRestkurs] = useState<string | null>(null);
  const [editingNyKurs, setEditingNyKurs] = useState<string | null>(null);

  const terminLabel = studentInfo.termin === 'vt' ? 'VT' : 'HT';
  
  // Calculate HP per period
  const calculatePeriodHP = (period: 'lp1' | 'lp2' | 'lp3' | 'lp4') => {
    let total = 0;
    
    restkurser.forEach(k => {
      if (k[period]) {
        const periods = [k.lp1, k.lp2, k.lp3, k.lp4].filter(Boolean).length;
        total += periods > 0 ? k.restpoang / periods : 0;
      }
    });
    
    nyaKurser.forEach(k => {
      if (k[period]) {
        const periods = [k.lp1, k.lp2, k.lp3, k.lp4].filter(Boolean).length;
        total += periods > 0 ? k.hp / periods : 0;
      }
    });
    
    return total;
  };

  const lp1HP = calculatePeriodHP('lp1');
  const lp2HP = calculatePeriodHP('lp2');
  const lp3HP = calculatePeriodHP('lp3');
  const lp4HP = calculatePeriodHP('lp4');
  const totalRestkurserHP = restkurser.reduce((sum, k) => sum + k.restpoang, 0);
  const totalNyaKurserHP = nyaKurser.reduce((sum, k) => sum + k.hp, 0);
  const totalHP = totalRestkurserHP + totalNyaKurserHP;

  const formatPeriods = (kurs: { lp1: boolean; lp2: boolean; lp3: boolean; lp4: boolean }) => {
    const periods = [];
    if (kurs.lp1) periods.push('LP1');
    if (kurs.lp2) periods.push('LP2');
    if (kurs.lp3) periods.push('LP3');
    if (kurs.lp4) periods.push('LP4');
    return periods.join(' & ') || '-';
  };

  const exportToWord = async () => {
    try {
      const FONT = 'Arial';
      const ACCENT = '2E75B6';
      const children: Paragraph[] = [];

      // Title with accent
      children.push(new Paragraph({
        children: [new TextRun({ text: `Studieplan för ${terminLabel}`, bold: true, size: 30, font: FONT, color: ACCENT })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 4 } },
      }));

      children.push(new Paragraph({
        children: [new TextRun({ text: `Genererat: ${new Date().toLocaleDateString('sv-SE')}`, size: 20, font: FONT, color: '888888', italics: true })],
        spacing: { after: 300 },
      }));

      // Student info
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Studentinformation', bold: true, size: 26, font: FONT })],
        spacing: { before: 200, after: 100 },
      }));
      children.push(new Paragraph({
        children: [
          new TextRun({ text: 'Namn: ', bold: true, size: 22, font: FONT }),
          new TextRun({ text: `${studentInfo.fornamn} ${studentInfo.efternamn}`, size: 22, font: FONT }),
        ],
        spacing: { after: 60 },
      }));
      children.push(new Paragraph({
        children: [
          new TextRun({ text: 'Program: ', bold: true, size: 22, font: FONT }),
          new TextRun({ text: studentInfo.program, size: 22, font: FONT }),
        ],
        spacing: { after: 60 },
      }));
      children.push(new Paragraph({
        children: [
          new TextRun({ text: 'Antagningsår: ', bold: true, size: 22, font: FONT }),
          new TextRun({ text: studentInfo.antagningsar, size: 22, font: FONT }),
        ],
        spacing: { after: 200 },
      }));

      // Summary
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Sammanfattning', bold: true, size: 26, font: FONT, color: ACCENT })],
        spacing: { before: 200, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT, space: 2 } },
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: `Totalt antal HP: ${totalHP}`, bold: true, size: 22, font: FONT })],
        spacing: { after: 60 },
      }));
      if (lp1HP > 0) children.push(new Paragraph({ children: [new TextRun({ text: `Läsperiod 1: ${lp1HP.toFixed(1)} HP`, size: 22, font: FONT })], spacing: { after: 40 } }));
      if (lp2HP > 0) children.push(new Paragraph({ children: [new TextRun({ text: `Läsperiod 2: ${lp2HP.toFixed(1)} HP`, size: 22, font: FONT })], spacing: { after: 40 } }));
      if (lp3HP > 0) children.push(new Paragraph({ children: [new TextRun({ text: `Läsperiod 3: ${lp3HP.toFixed(1)} HP`, size: 22, font: FONT })], spacing: { after: 40 } }));
      if (lp4HP > 0) children.push(new Paragraph({ children: [new TextRun({ text: `Läsperiod 4: ${lp4HP.toFixed(1)} HP`, size: 22, font: FONT })], spacing: { after: 200 } }));

      // Restkurser
      if (restkurser.length > 0) {
        children.push(new Paragraph({
          children: [new TextRun({ text: 'Restkurser (omregistrering)', bold: true, size: 26, font: FONT, color: ACCENT })],
          spacing: { before: 200, after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT, space: 2 } },
        }));
        restkurser.forEach(kurs => {
          children.push(new Paragraph({
            children: [new TextRun({ text: `${kurs.kurskod} – ${kurs.kursnamn} (${kurs.restpoang} HP) – ${formatPeriods(kurs)}`, size: 22, font: FONT })],
            bullet: { level: 0 },
            spacing: { after: 50 },
          }));
        });
      }

      // Nya kurser
      if (nyaKurser.length > 0) {
        children.push(new Paragraph({
          children: [new TextRun({ text: 'Nya kurser', bold: true, size: 26, font: FONT, color: ACCENT })],
          spacing: { before: 200, after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT, space: 2 } },
        }));
        nyaKurser.forEach(kurs => {
          children.push(new Paragraph({
            children: [new TextRun({ text: `${kurs.kurskod} – ${kurs.kursnamn} (${kurs.hp} HP) – ${formatPeriods(kurs)}`, size: 22, font: FONT })],
            bullet: { level: 0 },
            spacing: { after: 50 },
          }));
        });
      }

      // Contact
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Kontakt', bold: true, size: 26, font: FONT })],
        spacing: { before: 400, after: 100 },
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Vid frågor, kontakta din studievägledare.', size: 22, font: FONT })],
        spacing: { after: 50 },
      }));

      const doc = new Document({
        styles: { default: { document: { run: { font: FONT, size: 22 } } } },
        numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: 'bullet' as any, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
        sections: [{
          properties: {
            page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
          },
          children,
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
      saveAs(blob, `Studieplan_${terminLabel}_${studentInfo.efternamn}_${studentInfo.fornamn}.docx`);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-primary" />
            Studentens studieplan för {terminLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-background/80 rounded-lg p-4 text-center col-span-2 md:col-span-1">
              <p className="text-3xl font-bold text-primary">{totalHP}</p>
              <p className="text-sm text-muted-foreground">Totalt HP</p>
            </div>
            {lp1HP > 0 && (
              <div className="bg-background/80 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{lp1HP.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">LP1</p>
              </div>
            )}
            {lp2HP > 0 && (
              <div className="bg-background/80 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{lp2HP.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">LP2</p>
              </div>
            )}
            {lp3HP > 0 && (
              <div className="bg-background/80 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{lp3HP.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">LP3</p>
              </div>
            )}
            {lp4HP > 0 && (
              <div className="bg-background/80 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{lp4HP.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">LP4</p>
              </div>
            )}
          </div>

          {/* Student Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>
              {studentInfo.fornamn} {studentInfo.efternamn} • {studentInfo.program} • {studentInfo.antagningsar}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Restkurser Section */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              Restkurser (omregistrering)
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onAddRestkurs} className="gap-1">
              <Plus className="w-4 h-4" />
              Lägg till
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {restkurser.length === 0 ? (
            <p className="text-muted-foreground text-sm">Inga restkurser tillagda</p>
          ) : (
            <div className="space-y-2">
              {restkurser.map((kurs) => (
                <div key={kurs.id} className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  {editingRestkurs === kurs.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Kurskod"
                          value={kurs.kurskod}
                          onChange={(e) => onUpdateRestkurs(kurs.id, { kurskod: e.target.value })}
                        />
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="HP"
                          value={kurs.restpoang || ''}
                          onChange={(e) => onUpdateRestkurs(kurs.id, { restpoang: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <Input
                        placeholder="Kursnamn"
                        value={kurs.kursnamn}
                        onChange={(e) => onUpdateRestkurs(kurs.id, { kursnamn: e.target.value })}
                      />
                      <div className="flex flex-wrap gap-3">
                        {(['lp1', 'lp2', 'lp3', 'lp4'] as const).map((lp) => (
                          <div key={lp} className="flex items-center gap-1">
                            <Checkbox
                              id={`edit-rest-${lp}-${kurs.id}`}
                              checked={kurs[lp]}
                              onCheckedChange={(checked) => onUpdateRestkurs(kurs.id, { [lp]: checked === true })}
                            />
                            <Label htmlFor={`edit-rest-${lp}-${kurs.id}`} className="text-sm cursor-pointer">
                              {lp.toUpperCase()}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <Button size="sm" onClick={() => setEditingRestkurs(null)} className="gap-1">
                        <Check className="w-3 h-3" />
                        Klar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {kurs.kurskod} – {kurs.kursnamn}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {kurs.restpoang} HP • {formatPeriods(kurs)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingRestkurs(kurs.id)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onRemoveRestkurs(kurs.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nya kurser Section */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Nya kurser
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onAddNyKurs} className="gap-1">
              <Plus className="w-4 h-4" />
              Lägg till
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {nyaKurser.length === 0 ? (
            <p className="text-muted-foreground text-sm">Inga nya kurser tillagda</p>
          ) : (
            <div className="space-y-2">
              {nyaKurser.map((kurs) => (
                <div key={kurs.id} className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  {editingNyKurs === kurs.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Kurskod"
                          value={kurs.kurskod}
                          onChange={(e) => onUpdateNyKurs(kurs.id, { kurskod: e.target.value })}
                        />
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="HP"
                          value={kurs.hp || ''}
                          onChange={(e) => onUpdateNyKurs(kurs.id, { hp: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <Input
                        placeholder="Kursnamn"
                        value={kurs.kursnamn}
                        onChange={(e) => onUpdateNyKurs(kurs.id, { kursnamn: e.target.value })}
                      />
                      <div className="flex flex-wrap gap-3">
                        {(['lp1', 'lp2', 'lp3', 'lp4'] as const).map((lp) => (
                          <div key={lp} className="flex items-center gap-1">
                            <Checkbox
                              id={`edit-ny-${lp}-${kurs.id}`}
                              checked={kurs[lp]}
                              onCheckedChange={(checked) => onUpdateNyKurs(kurs.id, { [lp]: checked === true })}
                            />
                            <Label htmlFor={`edit-ny-${lp}-${kurs.id}`} className="text-sm cursor-pointer">
                              {lp.toUpperCase()}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <Button size="sm" onClick={() => setEditingNyKurs(null)} className="gap-1">
                        <Check className="w-3 h-3" />
                        Klar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {kurs.kurskod} – {kurs.kursnamn}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {kurs.hp} HP • {formatPeriods(kurs)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingNyKurs(kurs.id)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onRemoveNyKurs(kurs.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Export Button */}
      <div className="flex justify-center">
        <Button 
          onClick={exportToWord}
          size="lg"
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Download className="w-5 h-5" />
          Exportera som Word-dokument
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        HP-poängen räknas automatiskt ihop. Kurser kan redigeras direkt ovan.
      </p>
    </div>
  );
};
