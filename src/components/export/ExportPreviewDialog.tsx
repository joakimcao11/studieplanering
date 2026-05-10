import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
  Table, TableRow, TableCell, WidthType, ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';
import { Download, FileText } from 'lucide-react';
import {
  buildGovHeader, buildGovFooter, buildGovTitle, loadLogoBuffer,
  GOV_PAGE_PROPS, GOV_SANS, GOV_ACCENT, GOV_DEFAULT_FOOTER,
} from '@/utils/wordTemplate';
import {
  buildLuHeader, buildLuFooter, buildLuTitle, loadLuLogoBuffer,
  LU_PAGE_PROPS, LU_BODY_FONT, LU_DEFAULTS, LuHeaderInfo,
} from '@/utils/wordTemplateLU';
import lthLogo from '@/assets/lth-logo.png';
import luLogo from '@/assets/lu-logo.png';

export type DocSection =
  | { type: 'paragraph'; heading?: string; body: string }
  | { type: 'table'; heading?: string; columns: string[]; rows: string[][] };

export interface ExportPreviewProps {
  open: boolean;
  onClose: () => void;
  defaultTemplate?: 'LTH' | 'LU';
  documentName: string;          // ex "Minnesanteckning"
  fileBaseName: string;          // ex "minnesanteckning_anna"
  counselorName: string;
  date: string;                  // formatted ISO YYYY-MM-DD
  sections: DocSection[];        // initial content
}

export const ExportPreviewDialog = ({
  open, onClose, defaultTemplate = 'LTH',
  documentName, fileBaseName, counselorName, date, sections: initialSections,
}: ExportPreviewProps) => {
  const [template, setTemplate] = useState<'LTH' | 'LU'>(defaultTemplate);
  const [sections, setSections] = useState<DocSection[]>(initialSections);
  const [docName, setDocName] = useState(documentName);
  const [docDate, setDocDate] = useState(date);

  // LTH meta
  const [lth, setLth] = useState({
    counselor: counselorName,
    institution: 'Lunds Tekniska Högskola',
    unit: 'Studie- och karriärvägledningen',
    handler: 'Studievägledare',
    postalAddress: GOV_DEFAULT_FOOTER.postalAddress,
    visitAddress: GOV_DEFAULT_FOOTER.visitAddress,
    phone: GOV_DEFAULT_FOOTER.phone,
    email: GOV_DEFAULT_FOOTER.email,
    web: GOV_DEFAULT_FOOTER.web,
    recipient: '',
  });

  // LU meta
  const [lu, setLu] = useState<LuHeaderInfo & { recipient: string; documentName: string }>({
    ...LU_DEFAULTS,
    handler: counselorName || LU_DEFAULTS.handler,
    recipient: '',
    documentName: documentName,
  });

  useEffect(() => {
    if (open) {
      setSections(initialSections);
      setDocName(documentName);
      setDocDate(date);
      setLth((prev) => ({ ...prev, counselor: counselorName || prev.counselor }));
      setLu((prev) => ({ ...prev, handler: counselorName || prev.handler, documentName }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateSection = (idx: number, patch: Partial<DocSection>) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } as DocSection : s)));
  };

  const buildDocx = async () => {
    const FONT = template === 'LU' ? LU_BODY_FONT : GOV_SANS;
    const ACCENT = template === 'LU' ? '000000' : GOV_ACCENT;
    const children: (Paragraph | Table)[] = [];

    if (template === 'LU') {
      buildLuTitle({ documentName: docName, date: docDate, recipient: lu.recipient }).forEach((p) => children.push(p));
    } else {
      buildGovTitle().forEach((p) => children.push(p));
      children.push(new Paragraph({
        children: [new TextRun({ text: docName, bold: true, size: 24, font: FONT, color: ACCENT })],
        spacing: { after: 200 },
      }));
    }

    for (const sec of sections) {
      if (sec.type === 'table') {
        if (sec.heading) {
          children.push(new Paragraph({
            children: [new TextRun({ text: sec.heading, bold: true, size: 24, font: FONT, color: ACCENT })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
          }));
        }
        const border = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
        const borders = { top: border, bottom: border, left: border, right: border };
        const headerCells = sec.columns.map((c) => new TableCell({
          borders,
          shading: { fill: 'EEEEEE', type: ShadingType.CLEAR, color: 'auto' },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, size: 20, font: FONT })] })],
        }));
        const rows = [new TableRow({ children: headerCells, tableHeader: true })];
        for (const r of sec.rows) {
          rows.push(new TableRow({
            children: r.map((txt) => new TableCell({
              borders,
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: FONT })] })],
            })),
          }));
        }
        children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, rows }));
        children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 160 } }));
      } else {
        if (sec.heading) {
          children.push(new Paragraph({
            children: [new TextRun({ text: sec.heading, bold: true, size: 24, font: FONT, color: ACCENT })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }));
        }
        const lines = sec.body.split('\n');
        for (const raw of lines) {
          const line = raw.replace(/\r$/, '');
          const trimmed = line.trim();
          if (!trimmed) {
            children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 60 } }));
            continue;
          }
          if (/^[-*•]\s+/.test(trimmed)) {
            children.push(new Paragraph({
              children: [new TextRun({ text: trimmed.replace(/^[-*•]\s+/, ''), size: 22, font: FONT })],
              bullet: { level: 0 },
              spacing: { after: 60 },
            }));
            continue;
          }
          children.push(new Paragraph({
            children: [new TextRun({ text: trimmed, size: 22, font: FONT })],
            spacing: { after: 80 },
          }));
        }
      }
    }

    let header, footer, pageProps;
    if (template === 'LU') {
      const luLogoBuf = await loadLuLogoBuffer();
      header = buildLuHeader(lu, luLogoBuf);
      footer = buildLuFooter();
      pageProps = LU_PAGE_PROPS;
    } else {
      const logoBuffer = await loadLogoBuffer();
      header = buildGovHeader({ counselorName: lth.counselor || 'Studievägledare', date: docDate }, logoBuffer);
      footer = buildGovFooter({
        postalAddress: lth.postalAddress,
        visitAddress: lth.visitAddress,
        phone: lth.phone,
        email: lth.email,
        web: lth.web,
      });
      pageProps = GOV_PAGE_PROPS;
    }

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
        properties: pageProps,
        children,
        headers: { default: header },
        footers: { default: footer },
      }],
    });
    const blob = await Packer.toBlob(doc);
    const suffix = template === 'LU' ? '_LU' : '_LTH';
    saveAs(blob, `${fileBaseName}${suffix}.docx`);
    onClose();
  };

  // Live HTML preview
  const preview = useMemo(() => {
    const isLu = template === 'LU';
    return (
      <div className={`p-6 bg-white text-black text-[12px] leading-snug min-h-full ${isLu ? 'font-serif' : ''}`}>
        {isLu ? (
          <>
            <div className="flex items-start justify-between border-b border-gray-400 pb-2 mb-3">
              <img src={luLogo} alt="LU" className="h-14" />
              <div className="text-right text-[11px]">
                <div>{lu.institution}</div>
                <div>{lu.unit}</div>
                <div>{lu.handler}</div>
              </div>
            </div>
            <div className="text-[9px] italic text-gray-700 mb-4">
              <b>Postadress</b> {lu.postalAddress} &nbsp; <b>Besöksadress</b> {lu.visitAddress}<br />
              <b>Telefon</b> {lu.phone} &nbsp; <b>E-post</b> {lu.email} &nbsp; <b>Webb</b> {lu.web}
            </div>
            <div className="font-bold uppercase text-[16px]">{docName}</div>
            <div className="italic text-gray-700 mb-3">Datum {docDate}</div>
            {lu.recipient && <pre className="whitespace-pre-wrap mb-3">{lu.recipient}</pre>}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between border-b-2 pb-2 mb-3" style={{ borderColor: '#2E75B6' }}>
              <img src={lthLogo} alt="LTH" className="h-10" />
              <div className="text-right">
                <div className="font-bold text-[#003366]">{lth.unit}</div>
                <div className="text-[11px]">{lth.handler} · {lth.counselor}</div>
                <div className="text-[10px] text-gray-600">{docDate}</div>
              </div>
            </div>
            <div className="font-bold text-[20px] text-[#003366] border-b-2 border-[#2E75B6] pb-1">MINNESANTECKNING</div>
            <div className="font-bold mt-2 text-[#003366]">{docName}</div>
            {lth.recipient && <pre className="whitespace-pre-wrap mt-2 text-[11px]">{lth.recipient}</pre>}
            <div className="text-[9px] italic text-gray-600 mt-3 border-t pt-2">
              <b>Postadress</b> {lth.postalAddress} &nbsp; <b>Besöksadress</b> {lth.visitAddress}<br />
              <b>Telefon</b> {lth.phone} &nbsp; <b>E-post</b> {lth.email} &nbsp; <b>Webb</b> {lth.web}
            </div>
          </>
        )}

        {sections.map((s, i) => (
          <div key={i} className="mt-3">
            {s.heading && (
              <div className={`font-bold ${isLu ? 'text-black' : 'text-[#003366]'} mb-1`}>{s.heading}</div>
            )}
            {s.type === 'table' ? (
              <table className="w-full border-collapse text-[10px]">
                <thead><tr>{s.columns.map((c) => (
                  <th key={c} className="border bg-gray-100 p-1 text-left">{c}</th>
                ))}</tr></thead>
                <tbody>
                  {s.rows.map((r, ri) => (
                    <tr key={ri}>{r.map((v, ci) => <td key={ci} className="border p-1">{v}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <pre className="whitespace-pre-wrap font-[inherit]">{s.body}</pre>
            )}
          </div>
        ))}
      </div>
    );
  }, [template, sections, docName, docDate, lth, lu]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Förhandsgranska och exportera
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden flex-1 min-h-0">
          {/* Left: editor */}
          <ScrollArea className="h-[70vh] pr-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">Mall</Label>
                <RadioGroup value={template} onValueChange={(v) => setTemplate(v as 'LTH' | 'LU')} className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="LTH" /> LTH-mall
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="LU" /> LU-mall
                  </label>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Dokumentnamn</Label>
                  <Input value={docName} onChange={(e) => setDocName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Datum</Label>
                  <Input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
                </div>
              </div>

              {template === 'LTH' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Institution / Avdelning</Label>
                    <Input value={lth.institution} onChange={(e) => setLth({ ...lth, institution: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Enhet</Label>
                    <Input value={lth.unit} onChange={(e) => setLth({ ...lth, unit: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Handläggare/Titel</Label>
                    <Input value={lth.handler} onChange={(e) => setLth({ ...lth, handler: e.target.value })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Studievägledare</Label>
                    <Input value={lth.counselor} onChange={(e) => setLth({ ...lth, counselor: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Postadress</Label>
                    <Input value={lth.postalAddress} onChange={(e) => setLth({ ...lth, postalAddress: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Besöksadress</Label>
                    <Input value={lth.visitAddress} onChange={(e) => setLth({ ...lth, visitAddress: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Telefon</Label>
                    <Input value={lth.phone} onChange={(e) => setLth({ ...lth, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">E-post</Label>
                    <Input value={lth.email} onChange={(e) => setLth({ ...lth, email: e.target.value })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Webbadress</Label>
                    <Input value={lth.web} onChange={(e) => setLth({ ...lth, web: e.target.value })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Adressat (valfritt)</Label>
                    <Textarea rows={3} value={lth.recipient} onChange={(e) => setLth({ ...lth, recipient: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Institution / Avdelning</Label>
                    <Input value={lu.institution} onChange={(e) => setLu({ ...lu, institution: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Enhet</Label>
                    <Input value={lu.unit} onChange={(e) => setLu({ ...lu, unit: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Handläggare/Titel</Label>
                    <Input value={lu.handler} onChange={(e) => setLu({ ...lu, handler: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Postadress</Label>
                    <Input value={lu.postalAddress} onChange={(e) => setLu({ ...lu, postalAddress: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Besöksadress</Label>
                    <Input value={lu.visitAddress} onChange={(e) => setLu({ ...lu, visitAddress: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Telefon</Label>
                    <Input value={lu.phone} onChange={(e) => setLu({ ...lu, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">E-post</Label>
                    <Input value={lu.email} onChange={(e) => setLu({ ...lu, email: e.target.value })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Webbadress</Label>
                    <Input value={lu.web} onChange={(e) => setLu({ ...lu, web: e.target.value })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Adressat (valfritt)</Label>
                    <Textarea rows={3} value={lu.recipient} onChange={(e) => setLu({ ...lu, recipient: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="border-t pt-3 space-y-3">
                <Label className="font-medium">Sektioner</Label>
                {sections.map((s, i) => (
                  <div key={i} className="space-y-1 border rounded p-2">
                    {s.heading !== undefined && (
                      <Input value={s.heading || ''} onChange={(e) => updateSection(i, { heading: e.target.value })} placeholder="Rubrik" className="text-sm font-medium" />
                    )}
                    {s.type === 'paragraph' ? (
                      <Textarea rows={6} value={s.body} onChange={(e) => updateSection(i, { body: e.target.value })} className="text-xs font-mono" />
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Tabell ({s.rows.length} rader) – redigeras i handlingsplanen.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Right: preview */}
          <div className="border rounded bg-muted/20 overflow-hidden">
            <ScrollArea className="h-[70vh]">
              {preview}
              <div className="p-3 text-[10px] text-muted-foreground italic">
                Förhandsgranskning – exakt utseende kan skilja något i Word.
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button onClick={buildDocx}>
            <Download className="w-4 h-4 mr-2" /> Ladda ner Word
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};