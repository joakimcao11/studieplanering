// Shared "myndighetsstil" Word template helpers.
// Used by all modules (Studieplanering, Snabbplanering, Importera plan, Dokumentationsstöd)
// to produce consistent professional government-style memos.
import {
  Paragraph,
  TextRun,
  Header as DocxHeader,
  Footer,
  AlignmentType,
  BorderStyle,
  ImageRun,
  PageNumber,
  TabStopType,
  TabStopPosition,
} from 'docx';
import lthLogo from '@/assets/lth-logo.png';

export const GOV_FONT = 'Times New Roman';
export const GOV_SANS = 'Arial';
export const GOV_ACCENT = '003366'; // dark navy blue
export const GOV_ACCENT_LIGHT = '2E75B6';
export const GOV_MUTED = '555555';

export interface GovHeaderInfo {
  counselorName: string;
  date: string; // formatted Swedish date
}

/** Loads the LTH logo as ArrayBuffer for embedding in docx. */
export async function loadLogoBuffer(): Promise<ArrayBuffer | null> {
  try {
    const resp = await fetch(lthLogo);
    return await resp.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * Build the page header (logo left, "Studievägledningssamtal" + name + date right)
 * with a thin separator line below.
 */
export function buildGovHeader(info: GovHeaderInfo, logoBuffer: ArrayBuffer | null): DocxHeader {
  const headerChildren: any[] = [];

  if (logoBuffer) {
    headerChildren.push(
      new ImageRun({
        type: 'png',
        data: logoBuffer,
        transformation: { width: 110, height: 55 },
        altText: { title: 'LTH', description: 'Lunds Tekniska Högskola', name: 'LTH-logo' },
      } as any),
    );
  }

  headerChildren.push(
    new TextRun({ text: '\t' }),
    new TextRun({ text: 'Studievägledningssamtal', bold: true, size: 22, font: GOV_SANS, color: GOV_ACCENT }),
    new TextRun({ text: '\n', break: 1 }),
    new TextRun({ text: '\t' }),
    new TextRun({ text: info.counselorName || 'Studievägledare', size: 20, font: GOV_SANS }),
    new TextRun({ text: '\n', break: 1 }),
    new TextRun({ text: '\t' }),
    new TextRun({ text: info.date, size: 20, font: GOV_SANS, color: GOV_MUTED }),
  );

  return new DocxHeader({
    children: [
      new Paragraph({
        children: headerChildren,
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { after: 120 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: GOV_ACCENT_LIGHT, space: 4 },
        },
      }),
    ],
  });
}

/**
 * Standard LTH footer with postal/visit/phone/email/web information,
 * a thin top border, and right-aligned page number.
 */
export function buildGovFooter(): Footer {
  const small = (text: string, opts: any = {}) =>
    new TextRun({ text, size: 16, font: GOV_SANS, color: GOV_MUTED, ...opts });

  return new Footer({
    children: [
      new Paragraph({
        children: [
          small('Postadress ', { bold: true }),
          small('Lunds Tekniska Högskola, Studentservice, Box 118, 221 00 Lund'),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { before: 60, after: 0 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: GOV_ACCENT_LIGHT, space: 6 } },
      }),
      new Paragraph({
        children: [
          small('Besöksadress ', { bold: true }),
          small('Klas Anshelms Väg 10'),
        ],
        spacing: { after: 0 },
      }),
      new Paragraph({
        children: [
          small('Telefon ', { bold: true }),
          small('046-222 72 89   '),
          small('E-post ', { bold: true }),
          small('joakim.cao@lth.lu.se'),
        ],
        spacing: { after: 0 },
      }),
      new Paragraph({
        children: [
          small('Webbadress ', { bold: true }),
          small('www.student.lth.se'),
          new TextRun({ text: '\t' }),
          small('Sida '),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, font: GOV_SANS, color: GOV_MUTED }),
          small(' av '),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: GOV_SANS, color: GOV_MUTED }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { after: 60 },
      }),
    ],
  });
}

/**
 * The main "MINNESANTECKNING" title block with blue underline.
 * Used as the first body paragraph in all government memos.
 */
export function buildGovTitle(): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({ text: 'MINNESANTECKNING', bold: true, size: 40, font: GOV_SANS, color: GOV_ACCENT }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { before: 200, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOV_ACCENT_LIGHT, space: 6 } },
    }),
    new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 120 } }),
  ];
}

/**
 * Standard page properties (A4, 1-inch margins).
 */
export const GOV_PAGE_PROPS = {
  page: {
    size: { width: 11906, height: 16838 },
    margin: { top: 2400, right: 1440, bottom: 2200, left: 1440 },
  },
};
