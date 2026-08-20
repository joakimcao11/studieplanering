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
import { Download, FileText, Printer } from 'lucide-react';
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

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(',')[1] || '';
  const bin = atob(base64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

export type DocSection =
  | { type: 'paragraph'; heading?: string; body: string; pageBreak?: boolean }
  | { type: 'table'; heading?: string; columns: string[]; rows: string[][]; pageBreak?: boolean }
  /** Bilaga med bild (dataUrl). Renderas som bild i Word och PDF. */
  | { type: 'image'; heading?: string; dataUrl: string; caption?: string; pageBreak?: boolean };


export interface ExportPreviewProps {
  open: boolean;
  onClose: () => void;
  defaultTemplate?: 'LTH' | 'LU';
  documentName: string;          // ex "Minnesanteckning"
  fileBaseName: string;          // ex "minnesanteckning_anna"
  counselorName: string;
  date: string;                  // formatted ISO YYYY-MM-DD
  sections: DocSection[];        // initial content
  /** 'student' visar ett förenklat formulär för /student, 'counselor' full myndighetsmall för /svl. */
  variant?: 'counselor' | 'student';
  studentProgram?: string;
  studentYear?: string;
}

export const ExportPreviewDialog = ({
  open, onClose, defaultTemplate = 'LTH',
  documentName, fileBaseName, counselorName, date, sections: initialSections,
  variant = 'counselor', studentProgram = '', studentYear = '',
}: ExportPreviewProps) => {
  const isStudent = variant === 'student';
  const [template, setTemplate] = useState<'LTH' | 'LU' | 'CUSTOM'>(defaultTemplate);
  const [sections, setSections] = useState<DocSection[]>(initialSections);
  const [docName, setDocName] = useState(documentName);
  const [docDate, setDocDate] = useState(date);

  // Studentversionens fält (används i stället för myndighetsuppgifterna)
  const [stud, setStud] = useState({
    name: counselorName,
    program: studentProgram,
    year: studentYear,
  });

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

  // Custom template state (persists in localStorage)
  const CUSTOM_KEY = 'customTemplateSettings';
  const loadCustom = () => {
    try {
      const raw = localStorage.getItem(CUSTOM_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  };
  const defaultCustom = {
    counselor: counselorName,
    institution: 'Min organisation',
    unit: 'Min avdelning',
    handler: 'Handläggare',
    postalAddress: '',
    visitAddress: '',
    phone: '',
    email: '',
    web: '',
    recipient: '',
    logoDataUrl: '' as string,
    documentTitle: 'MINNESANTECKNING',
  };
  const [custom, setCustom] = useState(() => ({ ...defaultCustom, ...(loadCustom() || {}) }));
  useEffect(() => {
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom)); } catch {}
  }, [custom]);

  useEffect(() => {
    if (open) {
      setSections(initialSections);
      setDocName(documentName);
      setDocDate(date);
      setLth((prev) => ({ ...prev, counselor: counselorName || prev.counselor }));
      setLu((prev) => ({ ...prev, handler: counselorName || prev.handler, documentName }));
      setCustom((prev) => ({ ...prev, counselor: counselorName || prev.counselor }));
      setStud({ name: counselorName, program: studentProgram, year: studentYear });
      if (isStudent) setTemplate('LTH');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateSection = (idx: number, patch: Partial<DocSection>) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } as DocSection : s)));
  };

  /** PDF-export: öppnar en utskriftsvy med samma innehåll som Word-exporten. */
  const buildPdf = () => {
    const esc = (v: string) =>
      String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const logo = template === 'LU' ? luLogo : lthLogo;
    const accent = template === 'LU' ? '#000000' : `#${GOV_ACCENT}`;
    const font = template === 'LU' ? 'Georgia, serif' : 'Arial, Helvetica, sans-serif';

    const meta = isStudent
      ? [stud.name, stud.program, stud.year].filter(Boolean)
      : [lth.counselor, lth.institution, lth.unit].filter(Boolean);

    const body = sections.map((s) => {
      const heading = s.heading ? `<h2>${esc(s.heading)}</h2>` : '';
      if (s.type === 'table') {
        return `${heading}<table>
          <thead><tr>${s.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>${s.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`;
      }
      const paras = s.body.split('\n').map((line) =>
        line.trim() ? `<p>${esc(line)}</p>` : '<p class="sp"></p>').join('');
      return `${heading}${paras}`;
    }).join('');

    const html = `<!doctype html><html lang="sv"><head><meta charset="utf-8">
      <title>${esc(fileBaseName)}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: ${font}; color: #000; font-size: 11pt; line-height: 1.4; }
        .top { display: flex; justify-content: space-between; align-items: flex-start;
               border-bottom: 2px solid ${accent}; padding-bottom: 8px; margin-bottom: 18px; }
        .top img { height: 46px; }
        .meta { text-align: right; font-size: 9pt; color: #333; }
        h1 { font-size: 17pt; margin: 0 0 4px; }
        h2 { font-size: 12pt; margin: 18px 0 6px; color: ${accent}; }
        p { margin: 0 0 6px; }
        p.sp { margin: 0 0 8px; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; font-size: 10pt; }
        th, td { border: 1px solid #bbb; padding: 5px 7px; text-align: left; vertical-align: top; }
        th { background: #eee; font-weight: bold; }
        tr, table { page-break-inside: avoid; }
      </style></head><body>
      <div class="top">
        <img src="${logo}" alt="">
        <div class="meta">${meta.map((m) => `<div>${esc(m)}</div>`).join('')}<div>${esc(docDate)}</div></div>
      </div>
      <h1>${esc(docName)}</h1>
      ${body}
      <script>window.onload = function () { setTimeout(function () { window.print(); }, 300); };<\/script>
      </body></html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
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

    if (isStudent) {
      const meta = [
        stud.name ? `Namn: ${stud.name}` : '',
        stud.program ? `Program: ${stud.program}` : '',
        stud.year ? `Årskurs: ${stud.year}` : '',
        `Datum: ${docDate}`,
      ].filter(Boolean).join('   ·   ');
      children.push(new Paragraph({
        children: [new TextRun({ text: meta, size: 20, font: FONT })],
        spacing: { after: 240 },
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
    } else if (template === 'CUSTOM') {
      const logoBuf = custom.logoDataUrl
        ? dataUrlToArrayBuffer(custom.logoDataUrl)
        : await loadLogoBuffer();
      header = buildGovHeader({ counselorName: custom.counselor || 'Handläggare', date: docDate }, logoBuf);
      footer = buildGovFooter({
        postalAddress: custom.postalAddress,
        visitAddress: custom.visitAddress,
        phone: custom.phone,
        email: custom.email,
        web: custom.web,
      });
      pageProps = GOV_PAGE_PROPS;
    } else {
      const logoBuffer = await loadLogoBuffer();
      header = buildGovHeader(
        { counselorName: isStudent ? (stud.name || 'Student') : (lth.counselor || 'Studievägledare'), date: docDate },
        logoBuffer,
      );
      footer = isStudent ? buildGovFooter({
        postalAddress: '',
        visitAddress: '',
        phone: '',
        email: '',
        web: 'lth.se',
      }) : buildGovFooter({
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
    const suffix = template === 'LU' ? '_LU' : template === 'CUSTOM' ? '_CUSTOM' : '_LTH';
    saveAs(blob, `${fileBaseName}${suffix}.docx`);
    onClose();
  };

  // Live HTML preview
  const preview = useMemo(() => {
    const isLu = template === 'LU';
    const isCustom = template === 'CUSTOM';
    return (
      <div className={`p-6 bg-white text-black text-[12px] leading-snug min-h-full ${isLu ? 'font-serif' : ''}`}>
        {isStudent ? (
          <>
            <div className="flex items-center justify-between border-b-2 pb-2 mb-3" style={{ borderColor: '#2E75B6' }}>
              <img src={lthLogo} alt="LTH" className="h-10" />
              <div className="text-right text-[11px]">
                <div className="font-bold text-[#003366]">Studieplanering</div>
                <div className="text-gray-600">{docDate}</div>
              </div>
            </div>
            <div className="font-bold text-[20px] text-[#003366] border-b-2 border-[#2E75B6] pb-1">{docName}</div>
            <div className="text-[11px] mt-2">
              {stud.name && <>Namn: <b>{stud.name}</b> &nbsp;·&nbsp; </>}
              {stud.program && <>Program: <b>{stud.program}</b> &nbsp;·&nbsp; </>}
              {stud.year && <>Årskurs: <b>{stud.year}</b></>}
            </div>
          </>
        ) : isLu ? (
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
        ) : isCustom ? (
          <>
            <div className="flex items-center justify-between border-b-2 pb-2 mb-3" style={{ borderColor: '#2E75B6' }}>
              {custom.logoDataUrl ? (
                <img src={custom.logoDataUrl} alt="Logo" className="h-12 object-contain" />
              ) : (
                <div className="h-12 w-32 border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400">Logo</div>
              )}
              <div className="text-right">
                <div className="font-bold text-[#003366]">{custom.unit}</div>
                <div className="text-[11px]">{custom.handler} · {custom.counselor}</div>
                <div className="text-[10px] text-gray-600">{docDate}</div>
              </div>
            </div>
            <div className="font-bold text-[20px] text-[#003366] border-b-2 border-[#2E75B6] pb-1">{custom.documentTitle}</div>
            <div className="font-bold mt-2 text-[#003366]">{docName}</div>
            {custom.recipient && <pre className="whitespace-pre-wrap mt-2 text-[11px]">{custom.recipient}</pre>}
            <div className="text-[9px] italic text-gray-600 mt-3 border-t pt-2">
              <b>Postadress</b> {custom.postalAddress} &nbsp; <b>Besöksadress</b> {custom.visitAddress}<br />
              <b>Telefon</b> {custom.phone} &nbsp; <b>E-post</b> {custom.email} &nbsp; <b>Webb</b> {custom.web}
            </div>
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
  }, [template, sections, docName, docDate, lth, lu, custom, isStudent, stud]);

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
              {!isStudent && (
              <div className="space-y-2">
                <Label className="font-medium">Mall</Label>
                <RadioGroup value={template} onValueChange={(v) => setTemplate(v as 'LTH' | 'LU' | 'CUSTOM')} className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="LTH" /> LTH-mall
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="LU" /> LU-mall
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="CUSTOM" /> Anpassad mall
                  </label>
                </RadioGroup>
              </div>
              )}

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

              {isStudent ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Ditt namn</Label>
                    <Input value={stud.name} onChange={(e) => setStud({ ...stud, name: e.target.value })} placeholder="Förnamn Efternamn" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Program</Label>
                    <Input value={stud.program} onChange={(e) => setStud({ ...stud, program: e.target.value })} placeholder="t.ex. D – Datateknik" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Årskurs</Label>
                    <Input value={stud.year} onChange={(e) => setStud({ ...stud, year: e.target.value })} placeholder="t.ex. 2" />
                  </div>
                  <p className="col-span-2 text-[11px] text-muted-foreground">
                    Dokumentet skapas som en personlig studieplanering. Du kan ändra rubriker och text i sektionerna nedan innan du laddar ner.
                  </p>
                </div>
              ) : template === 'LTH' ? (
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
              ) : template === 'LU' ? (
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
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Logo (PNG/JPG rekommenderas)</Label>
                    <div className="flex items-center gap-2">
                      {custom.logoDataUrl && (
                        <img src={custom.logoDataUrl} alt="Logo" className="h-10 border rounded p-1 bg-white object-contain" />
                      )}
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => setCustom({ ...custom, logoDataUrl: String(reader.result || '') });
                          reader.readAsDataURL(file);
                        }}
                        className="text-xs"
                      />
                      {custom.logoDataUrl && (
                        <Button size="sm" variant="outline" onClick={() => setCustom({ ...custom, logoDataUrl: '' })}>
                          Ta bort
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Dokumenttitel (stor rubrik)</Label>
                    <Input value={custom.documentTitle} onChange={(e) => setCustom({ ...custom, documentTitle: e.target.value })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Institution / Organisation</Label>
                    <Input value={custom.institution} onChange={(e) => setCustom({ ...custom, institution: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Enhet / Avdelning</Label>
                    <Input value={custom.unit} onChange={(e) => setCustom({ ...custom, unit: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Handläggare/Titel</Label>
                    <Input value={custom.handler} onChange={(e) => setCustom({ ...custom, handler: e.target.value })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Namn (handläggare)</Label>
                    <Input value={custom.counselor} onChange={(e) => setCustom({ ...custom, counselor: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Postadress</Label>
                    <Input value={custom.postalAddress} onChange={(e) => setCustom({ ...custom, postalAddress: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Besöksadress</Label>
                    <Input value={custom.visitAddress} onChange={(e) => setCustom({ ...custom, visitAddress: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Telefon</Label>
                    <Input value={custom.phone} onChange={(e) => setCustom({ ...custom, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">E-post</Label>
                    <Input value={custom.email} onChange={(e) => setCustom({ ...custom, email: e.target.value })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Webbadress</Label>
                    <Input value={custom.web} onChange={(e) => setCustom({ ...custom, web: e.target.value })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Adressat (valfritt)</Label>
                    <Textarea rows={3} value={custom.recipient} onChange={(e) => setCustom({ ...custom, recipient: e.target.value })} />
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
          <Button variant="outline" onClick={buildPdf}>
            <Printer className="w-4 h-4 mr-2" /> Ladda ner PDF
          </Button>
          <Button onClick={buildDocx}>
            <Download className="w-4 h-4 mr-2" /> Ladda ner Word
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};