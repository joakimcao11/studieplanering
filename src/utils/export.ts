import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, Footer, Header as DocxHeader, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { StudentInfo, TermPlan, calculatePeriodHP, calculateTermHP, getCounselorById } from '@/types/planning';

const EXAM_INFO_TEXT = `Utbildningens upplägg och examenskrav

Din civilingenjörsexamen på 300 hp ska innehålla kurser enligt nedan. Dessa krav är inte behörighetskrav för att få påbörja ett examensarbete.

• Obligatoriska kurser – ca 180 hp (Åk 1–3)
• Kurser i specialisering – minst 45 hp, varav minst 30 hp på A-nivå (Åk 4–5)
• Valfria kurser – ca 45 hp, varav max 15 hp externt valfria (Åk 4–5)
• Examensarbete – 30 hp på A-nivå (Åk 5)

För studenter antagna:
• 2023 eller tidigare: minst 75 hp på A-nivå
• 2024 eller senare: minst 90 hp på A-nivå

Förtydliganden:
• Kurser i specialisering betraktas som valfria kurser
• Max 15 hp får vara externt valfria
• Endast avslutade kurser med slutbetyg kan ingå i examen`;

interface ExportData {
  studentInfo: StudentInfo;
  agenda: string;
  terms: TermPlan[];
  notes: string;
}

const generateTextContent = (data: ExportData): string => {
  const currentDate = new Date().toLocaleDateString('sv-SE');
  const programName = data.studentInfo.program === 'D' ? 'Datateknik' : 'Infocom';
  const counselor = getCounselorById(data.studentInfo.counselorId);

  let content = `${counselor?.displayName || 'STVL'}
${counselor?.email || ''}

================================================================================

MINNESANTECKNINGAR - STUDIEPLANERING

================================================================================

Syfte: Studieplanering med studievägledare
Datum: ${currentDate}
Student: ${data.studentInfo.name || '—'}
Program och kull: ${programName}${data.studentInfo.yearGroup ? ` (${data.studentInfo.yearGroup})` : ''}

`;

  if (data.agenda) {
    content += `AGENDA
${'-'.repeat(40)}
${data.agenda}

`;
  }

  content += `STUDIEPLANERING
${'-'.repeat(40)}

`;

  data.terms.forEach((term) => {
    const semesterLabel = term.semester === 'HT' ? 'Hösttermin' : 'Vårtermin';
    const period1Label = term.semester === 'HT' ? 'LP1' : 'LP3';
    const period2Label = term.semester === 'HT' ? 'LP2' : 'LP4';
    const lp1HP = calculatePeriodHP(term.lp1);
    const lp2HP = calculatePeriodHP(term.lp2);
    const termHP = calculateTermHP(term);
    const displayYear = term.customYearLabel || term.year;

    content += `${semesterLabel} ${displayYear}
`;
    
    content += `  ${period1Label} (${lp1HP} hp):
`;
    if (term.lp1.length === 0) {
      content += `    - Inga kurser planerade\n`;
    } else {
      term.lp1.forEach(course => {
        content += `    - ${course.code}: ${course.name} (${course.hp} hp)${course.isCustom ? ' [Egen kurs]' : ''}\n`;
      });
    }

    content += `  ${period2Label} (${lp2HP} hp):
`;
    if (term.lp2.length === 0) {
      content += `    - Inga kurser planerade\n`;
    } else {
      term.lp2.forEach(course => {
        content += `    - ${course.code}: ${course.name} (${course.hp} hp)${course.isCustom ? ' [Egen kurs]' : ''}\n`;
      });
    }

    content += `  Totalt hp denna termin: ${termHP} hp\n`;
    
    if (term.retakeExamNotes) {
      content += `  Omtentamensperiod: ${term.retakeExamNotes}\n`;
    }
    
    content += `\n`;
  });

  if (data.notes) {
    content += `ÖVRIGA ANTECKNINGAR
${'-'.repeat(40)}
${data.notes}

`;
  }

  content += `================================================================================

${EXAM_INFO_TEXT}

================================================================================

Studie- och karriärvägledningen LTH
`;

  return content;
};

export const exportToText = (data: ExportData) => {
  const content = generateTextContent(data);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const fileName = `studieplanering_${data.studentInfo.name?.replace(/\s+/g, '_') || 'student'}_${new Date().toISOString().split('T')[0]}.txt`;
  saveAs(blob, fileName);
};

export const exportToWord = async (data: ExportData) => {
  const currentDate = new Date().toLocaleDateString('sv-SE');
  const programName = data.studentInfo.program === 'D' ? 'Datateknik' : 'Infocom';
  const counselor = getCounselorById(data.studentInfo.counselorId);

  const sections: Paragraph[] = [];

  // Header info
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: counselor?.displayName || 'STVL', bold: true })],
    }),
    new Paragraph({
      children: [new TextRun({ text: counselor?.email || '', color: '666666' })],
    }),
    new Paragraph({ children: [] }), // Empty line
  );

  // Title
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'MINNESANTECKNINGAR - STUDIEPLANERING', bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
  );

  // Basic info
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Syfte: ', bold: true }),
        new TextRun({ text: 'Studieplanering med studievägledare' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Datum: ', bold: true }),
        new TextRun({ text: currentDate }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Student: ', bold: true }),
        new TextRun({ text: data.studentInfo.name || '—' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Program och kull: ', bold: true }),
        new TextRun({ text: `${programName}${data.studentInfo.yearGroup ? ` (${data.studentInfo.yearGroup})` : ''}` }),
      ],
    }),
    new Paragraph({ children: [] }),
  );

  // Agenda
  if (data.agenda) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'Agenda', bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        children: [new TextRun({ text: data.agenda })],
      }),
      new Paragraph({ children: [] }),
    );
  }

  // Study planning
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'Studieplanering', bold: true, size: 24 })],
      heading: HeadingLevel.HEADING_2,
    }),
  );

  data.terms.forEach((term) => {
    const semesterLabel = term.semester === 'HT' ? 'Hösttermin' : 'Vårtermin';
    const period1Label = term.semester === 'HT' ? 'LP1' : 'LP3';
    const period2Label = term.semester === 'HT' ? 'LP2' : 'LP4';
    const lp1HP = calculatePeriodHP(term.lp1);
    const lp2HP = calculatePeriodHP(term.lp2);
    const termHP = calculateTermHP(term);
    const displayYear = term.customYearLabel || term.year;

    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `${semesterLabel} ${displayYear}`, bold: true })],
        spacing: { before: 200 },
      }),
    );

    // LP1/LP3
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `${period1Label} (${lp1HP} hp):`, italics: true })],
        indent: { left: 360 },
      }),
    );
    
    if (term.lp1.length === 0) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: '- Inga kurser planerade' })],
          indent: { left: 720 },
        }),
      );
    } else {
      term.lp1.forEach(course => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `- ${course.code}: ${course.name} (${course.hp} hp)` }),
              course.isCustom ? new TextRun({ text: ' [Egen kurs]', italics: true }) : new TextRun({ text: '' }),
            ],
            indent: { left: 720 },
          }),
        );
      });
    }

    // LP2/LP4
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `${period2Label} (${lp2HP} hp):`, italics: true })],
        indent: { left: 360 },
      }),
    );
    
    if (term.lp2.length === 0) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: '- Inga kurser planerade' })],
          indent: { left: 720 },
        }),
      );
    } else {
      term.lp2.forEach(course => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `- ${course.code}: ${course.name} (${course.hp} hp)` }),
              course.isCustom ? new TextRun({ text: ' [Egen kurs]', italics: true }) : new TextRun({ text: '' }),
            ],
            indent: { left: 720 },
          }),
        );
      });
    }

    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `Totalt hp denna termin: ${termHP} hp`, bold: true })],
        indent: { left: 360 },
      }),
    );

    if (term.retakeExamNotes) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: `Omtentamensperiod: ${term.retakeExamNotes}` })],
          indent: { left: 360 },
        }),
      );
    }
  });

  sections.push(new Paragraph({ children: [] }));

  // Notes
  if (data.notes) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'Övriga anteckningar', bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        children: [new TextRun({ text: data.notes })],
      }),
      new Paragraph({ children: [] }),
    );
  }

  // Exam info (mandatory)
  sections.push(
    new Paragraph({
      children: [],
      pageBreakBefore: true,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Utbildningens upplägg och examenskrav', bold: true, size: 24 })],
      heading: HeadingLevel.HEADING_2,
    }),
  );

  const examInfoLines = EXAM_INFO_TEXT.split('\n').slice(2); // Skip title
  examInfoLines.forEach(line => {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: line })],
      }),
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Studie- och karriärvägledningen LTH', size: 18 })],
                alignment: AlignmentType.LEFT,
              }),
            ],
          }),
        },
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `studieplanering_${data.studentInfo.name?.replace(/\s+/g, '_') || 'student'}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, fileName);
};
