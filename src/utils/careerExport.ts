import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
  AlignmentType,
  LevelFormat,
} from 'docx';
import type { CareerProfile } from '@/types/careerProfile';
import { allItems } from '@/hooks/useCareerProfile';
import { REFLECTION_QUESTIONS } from '@/components/career/ProfileReflection';

export type ExportFormat = 'png' | 'pdf' | 'pptx' | 'docx';
export type PageOrientation = 'landscape' | 'portrait';

const fileBase = (profile: CareerProfile) =>
  `Min-Karriarprofil-${(profile.profileName || 'profil').replace(/[^\w\-åäöÅÄÖ ]/g, '').trim().replace(/\s+/g, '-')}`;

export const captureCanvas = async (element: HTMLElement): Promise<string> =>
  toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
    filter: (node) => {
      const el = node as HTMLElement;
      if (el?.classList?.contains?.('react-flow__controls')) return false;
      if (el?.classList?.contains?.('react-flow__minimap')) return false;
      if (el?.dataset?.exportHide === 'true') return false;
      return true;
    },
  });

const sections = (profile: CareerProfile) =>
  profile.categories
    .filter((c) => allItems(c).length > 0)
    .map((c) => ({ title: c.title, items: allItems(c), note: c.note || '' }));

/* ---------------------------------- PNG ---------------------------------- */
export const exportPng = async (profile: CareerProfile, element: HTMLElement) => {
  const dataUrl = await captureCanvas(element);
  const res = await fetch(dataUrl);
  saveAs(await res.blob(), `${fileBase(profile)}.png`);
};

/* ---------------------------------- PDF ---------------------------------- */
export const exportPdf = async (
  profile: CareerProfile,
  element: HTMLElement,
  orientation: PageOrientation = 'landscape',
) => {
  const dataUrl = await captureCanvas(element);
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(20, 40, 90);
  doc.text(`Min Karriärprofil – ${profile.profileName || ''}`.trim(), margin, margin + 6);

  const img = new Image();
  img.src = dataUrl;
  await new Promise((r) => {
    img.onload = r;
    img.onerror = r;
  });
  const maxW = pw - margin * 2;
  const maxH = ph - margin * 2 - 40;
  const ratio = img.width && img.height ? img.height / img.width : 0.6;
  let w = maxW;
  let h = w * ratio;
  if (h > maxH) {
    h = maxH;
    w = h / ratio;
  }
  doc.addImage(dataUrl, 'PNG', margin + (maxW - w) / 2, margin + 30, w, h, undefined, 'FAST');

  // Innehållssidor
  doc.addPage();
  let y = margin;
  const ensure = (need: number) => {
    if (y + need > ph - margin) {
      doc.addPage();
      y = margin;
    }
  };
  const heading = (t: string) => {
    ensure(34);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(20, 40, 90);
    doc.text(t, margin, y);
    y += 18;
  };
  const body = (t: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(30);
    for (const line of doc.splitTextToSize(t, pw - margin * 2)) {
      ensure(16);
      doc.text(line, margin, y);
      y += 15;
    }
  };

  for (const s of sections(profile)) {
    heading(s.title);
    body(s.items.map((i) => `• ${i}`).join('\n'));
    if (s.note) body(`Anteckning: ${s.note}`);
    y += 8;
  }
  if (profile.comparisonReflection) {
    heading('Min reflektion');
    body(profile.comparisonReflection);
    y += 8;
  }
  const answered = REFLECTION_QUESTIONS.filter((q) => profile.reflectionAnswers[q.id]);
  if (answered.length) {
    heading('Reflektionsfrågor');
    answered.forEach((q) => body(`${q.q}\n${profile.reflectionAnswers[q.id]}`));
    y += 8;
  }
  if (profile.nextStep || (profile.nextStepIdeas || []).length) {
    heading('Mitt nästa steg');
    if ((profile.nextStepIdeas || []).length) body(profile.nextStepIdeas.map((i) => `• ${i}`).join('\n'));
    if (profile.nextStep) body(profile.nextStep);
  }

  doc.save(`${fileBase(profile)}.pdf`);
};

/* ---------------------------------- PPTX --------------------------------- */
export const exportPptx = async (profile: CareerProfile, element: HTMLElement) => {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const dataUrl = await captureCanvas(element);
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  const NAVY = '14285C';
  const s1 = pptx.addSlide();
  s1.background = { color: NAVY };
  s1.addText('MIN KARRIÄRPROFIL', { x: 0.5, y: 0.4, w: 9, fontSize: 28, bold: true, color: 'FFFFFF' });
  s1.addText(profile.profileName || '', { x: 0.5, y: 1.0, w: 9, fontSize: 20, color: 'CADCFC' });
  s1.addImage({ data: dataUrl, x: 0.6, y: 1.6, w: 8.8, h: 3.6, sizing: { type: 'contain', w: 8.8, h: 3.6 } });

  const bulletSlide = (title: string, groups: { title: string; items: string[] }[]) => {
    if (!groups.length) return;
    const s = pptx.addSlide();
    s.addText(title, { x: 0.5, y: 0.35, w: 9, fontSize: 26, bold: true, color: NAVY });
    const text = groups.flatMap((g) => [
      { text: g.title, options: { bold: true, fontSize: 16, color: NAVY, breakLine: true } },
      ...g.items.map((i) => ({ text: i, options: { fontSize: 14, bullet: true, breakLine: true, color: '333333' } })),
    ]);
    s.addText(text as never, { x: 0.6, y: 1.1, w: 8.8, h: 4.0 });
  };

  const pick = (ids: string[]) =>
    sections(profile).filter((_, idx) => true).filter((s) =>
      profile.categories.some((c) => ids.includes(c.id) && c.title === s.title),
    );

  bulletSlide('Det här är viktigt för mig', pick(['values', 'drivers', 'needs']));
  bulletSlide('Det här kan jag och tar med mig', pick(['traits', 'personality', 'skills', 'competencies', 'knowledge', 'experience']));
  bulletSlide('Det här är jag nyfiken på', pick(['curious', 'learning', 'contribution', 'world', 'directions']));

  const s5 = pptx.addSlide();
  s5.addText('Mitt nästa steg', { x: 0.5, y: 0.35, w: 9, fontSize: 26, bold: true, color: NAVY });
  const steps = [...(profile.nextStepIdeas || []), profile.nextStep].filter(Boolean) as string[];
  s5.addText(steps.length ? steps.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })) as never : 'Inget nästa steg ifyllt ännu.', {
    x: 0.6,
    y: 1.1,
    w: 8.8,
    fontSize: 16,
    color: '333333',
  });

  await pptx.writeFile({ fileName: `${fileBase(profile)}.pptx` });
};

/* ---------------------------------- DOCX --------------------------------- */
export const exportDocx = async (profile: CareerProfile, element: HTMLElement) => {
  const dataUrl = await captureCanvas(element);
  const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0));

  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun(`MIN KARRIÄRPROFIL – ${(profile.profileName || '').toUpperCase()}`)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          type: 'png',
          data: bytes,
          transformation: { width: 600, height: 360 },
          altText: { title: 'Karriärprofil', description: 'Visualisering av karriärprofilen', name: 'karriarprofil' },
        }),
      ],
    }),
  ];

  for (const s of sections(profile)) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(s.title.toUpperCase())] }));
    for (const item of s.items) {
      children.push(new Paragraph({ numbering: { reference: 'career-bullets', level: 0 }, children: [new TextRun(item)] }));
    }
    if (s.note) children.push(new Paragraph({ children: [new TextRun({ text: s.note, italics: true })] }));
  }

  if (profile.comparisonReflection) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('MIN REFLEKTION')] }));
    children.push(new Paragraph({ children: [new TextRun(profile.comparisonReflection)] }));
  }
  const answered = REFLECTION_QUESTIONS.filter((q) => profile.reflectionAnswers[q.id]);
  if (answered.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('REFLEKTIONSFRÅGOR')] }));
    answered.forEach((q) => {
      children.push(new Paragraph({ children: [new TextRun({ text: q.q, bold: true })] }));
      children.push(new Paragraph({ children: [new TextRun(profile.reflectionAnswers[q.id])] }));
    });
  }
  if (profile.nextStep || (profile.nextStepIdeas || []).length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('MITT NÄSTA STEG')] }));
    (profile.nextStepIdeas || []).forEach((i) =>
      children.push(new Paragraph({ numbering: { reference: 'career-bullets', level: 0 }, children: [new TextRun(i)] })),
    );
    if (profile.nextStep) children.push(new Paragraph({ children: [new TextRun(profile.nextStep)] }));
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 32, bold: true, font: 'Arial' },
          paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 26, bold: true, font: 'Arial' },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'career-bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileBase(profile)}.docx`);
};
