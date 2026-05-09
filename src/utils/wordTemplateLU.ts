// Lunds universitets dokumentmall (LU-mall).
// Mirrors wordTemplate.ts API with `buildLuHeader`, `buildLuFooter`, `buildLuTitle`.
import {
  Paragraph,
  TextRun,
  Header as DocxHeader,
  Footer,
  AlignmentType,
  BorderStyle,
  TabStopType,
  TabStopPosition,
  PageNumber,
} from 'docx';

export const LU_BODY_FONT = 'Times New Roman';
export const LU_SANS = 'Arial';

export interface LuHeaderInfo {
  institution: string;   // "Institution, Avdelning"
  unit: string;          // "Enhet etc"
  handler: string;       // "Handläggare, Titel"
  postalAddress: string;
  visitAddress: string;
  phone: string;
  email: string;
  web: string;
}

export interface LuTitleInfo {
  documentName: string;  // ex "MINNESANTECKNING"
  date: string;          // "2026-05-09"
  recipient?: string;    // multi-line, optional
}

export const LU_DEFAULTS: LuHeaderInfo = {
  institution: 'Lunds Tekniska Högskola',
  unit: 'Studie- och karriärvägledningen',
  handler: 'Studievägledare',
  postalAddress: 'Box 118, 221 00 Lund',
  visitAddress: 'Klas Anshelms Väg 10',
  phone: '046-222 00 00',
  email: 'info@lth.lu.se',
  web: 'www.student.lth.se',
};

export function buildLuHeader(info: LuHeaderInfo): DocxHeader {
  const small = (text: string, opts: any = {}) =>
    new TextRun({ text, size: 16, font: LU_SANS, italics: true, color: '444444', ...opts });

  return new DocxHeader({
    children: [
      // Three-line institution block (right-aligned beside imaginary logo space)
      new Paragraph({
        children: [
          new TextRun({ text: 'LUNDS UNIVERSITET', bold: true, size: 22, font: LU_SANS }),
          new TextRun({ text: '\t' }),
          new TextRun({ text: info.institution, size: 18, font: LU_SANS }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { after: 0 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '\t' }),
          new TextRun({ text: info.unit, size: 18, font: LU_SANS }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { after: 0 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '\t' }),
          new TextRun({ text: info.handler, size: 18, font: LU_SANS }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { after: 100 },
      }),
      // Address strip
      new Paragraph({
        children: [
          small('Postadress ', { bold: true, italics: false }),
          small(info.postalAddress + '   '),
          small('Besöksadress ', { bold: true, italics: false }),
          small(info.visitAddress),
        ],
        spacing: { after: 0 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: '888888', space: 4 } },
      }),
      new Paragraph({
        children: [
          small('Telefon ', { bold: true, italics: false }),
          small(info.phone + '   '),
          small('E-post ', { bold: true, italics: false }),
          small(info.email + '   '),
          small('Webb ', { bold: true, italics: false }),
          small(info.web),
        ],
        spacing: { after: 120 },
      }),
    ],
  });
}

export function buildLuFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: 'Sida ', size: 16, font: LU_SANS, color: '666666' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, font: LU_SANS, color: '666666' }),
          new TextRun({ text: ' av ', size: 16, font: LU_SANS, color: '666666' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: LU_SANS, color: '666666' }),
        ],
        alignment: AlignmentType.RIGHT,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: '888888', space: 6 } },
      }),
    ],
  });
}

export function buildLuTitle(info: LuTitleInfo): Paragraph[] {
  const out: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: info.documentName.toUpperCase(), bold: true, size: 32, font: LU_SANS }),
      ],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Datum ', italics: true, size: 20, font: LU_SANS, color: '555555' }),
        new TextRun({ text: info.date, size: 20, font: LU_SANS }),
      ],
      spacing: { after: 200 },
    }),
  ];
  if (info.recipient && info.recipient.trim()) {
    info.recipient.split('\n').forEach((line) => {
      out.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 22, font: LU_BODY_FONT })],
          spacing: { after: 60 },
        }),
      );
    });
    out.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 200 } }));
  }
  return out;
}

export const LU_PAGE_PROPS = {
  page: {
    size: { width: 11906, height: 16838 },
    margin: { top: 2200, right: 1440, bottom: 1700, left: 1440 },
  },
};