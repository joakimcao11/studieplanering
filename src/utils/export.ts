import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, Footer, Header as DocxHeader, ImageRun, convertInchesToTwip, LineRuleType } from 'docx';
import { saveAs } from 'file-saver';
import { StudentInfo, TermPlan, ActionItem, calculatePeriodHP, calculateTermHP, getCounselorById } from '@/types/planning';
import { TemplateSettings } from '@/hooks/useTemplateSettings';

interface ExportData {
  studentInfo: StudentInfo;
  agenda: string;
  terms: TermPlan[];
  notes: string;
  actionItems?: ActionItem[];
  templateSettings?: TemplateSettings;
}

const getTemplateDefaults = (): TemplateSettings => ({
  font_name: 'Times New Roman',
  font_size_normal: '24',
  font_size_heading1: '32',
  font_size_heading2: '28',
  font_size_heading3: '26',
  document_title: 'MINNESANTECKNINGAR – STUDIEPLANERING',
  exam_info_title: 'Utbildningens upplägg och examenskrav',
  exam_info_text: `Din civilingenjörsexamen på 300 hp ska innehålla kurser enligt nedan. Dessa krav är inte behörighetskrav för att få påbörja ett examensarbete.

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
• Endast avslutade kurser med slutbetyg kan ingå i examen`,
  footer_text: 'Studie- och karriärvägledningen LTH',
  purpose_text: 'Studieplanering med studievägledare',
});

const generateTextContent = (data: ExportData): string => {
  const currentDate = data.studentInfo.customDate 
    ? new Date(data.studentInfo.customDate).toLocaleDateString('sv-SE')
    : new Date().toLocaleDateString('sv-SE');
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
    const semesterLabel = term.customSemesterLabel || (term.semester === 'HT' ? 'Hösttermin' : 'Vårtermin');
    const period1Label = term.semester === 'HT' ? 'LP1' : 'LP3';
    const period2Label = term.semester === 'HT' ? 'LP2' : 'LP4';
    const lp1HP = calculatePeriodHP(term.lp1);
    const lp2HP = calculatePeriodHP(term.lp2);
    const termHP = calculateTermHP(term);
    const displayYear = term.customYearLabel || term.year;

    content += `${semesterLabel} ${displayYear}
`;
    
    content += `  ${period1Label} (${lp1HP.toFixed(2).replace(/\.?0+$/, '')} hp):
`;
    if (term.lp1.length === 0) {
      content += `    - Inga kurser planerade\n`;
    } else {
      term.lp1.forEach(course => {
        const effectiveHP = course.studyPace && course.studyPace !== 100 
          ? (course.hp * course.studyPace / 100).toFixed(2).replace(/\.?0+$/, '')
          : course.hp.toString();
        const paceInfo = course.studyPace && course.studyPace !== 100 ? ` [${course.studyPace}%]` : '';
        const restkursInfo = course.completedHP && course.completedHP > 0 
          ? ` *Restkurs (${course.completedHP} hp avklarade, ${Math.max(0, course.hp - course.completedHP)} hp kvar)` : '';
        content += `    - ${course.code}: ${course.isMultiPeriod ? '*' : ''}${course.name} (${effectiveHP} hp)${paceInfo}${restkursInfo}${course.isCustom ? ' [Egen kurs]' : ''}\n`;
      });
    }

    content += `  ${period2Label} (${lp2HP.toFixed(2).replace(/\.?0+$/, '')} hp):
`;
    if (term.lp2.length === 0) {
      content += `    - Inga kurser planerade\n`;
    } else {
      term.lp2.forEach(course => {
        const effectiveHP = course.studyPace && course.studyPace !== 100 
          ? (course.hp * course.studyPace / 100).toFixed(2).replace(/\.?0+$/, '')
          : course.hp.toString();
        const paceInfo = course.studyPace && course.studyPace !== 100 ? ` [${course.studyPace}%]` : '';
        const restkursInfo = course.completedHP && course.completedHP > 0 
          ? ` *Restkurs (${course.completedHP} hp avklarade, ${Math.max(0, course.hp - course.completedHP)} hp kvar)` : '';
        content += `    - ${course.code}: ${course.isMultiPeriod ? '*' : ''}${course.name} (${effectiveHP} hp)${paceInfo}${restkursInfo}${course.isCustom ? ' [Egen kurs]' : ''}\n`;
      });
    }

    content += `  Totalt hp denna termin: ${termHP.toFixed(2).replace(/\.?0+$/, '')} hp\n`;
    
    if (term.retakeExamNotes) {
      content += `  Omtentamensperiod: ${term.retakeExamNotes}\n`;
    }
    
    content += `\n`;
  });

  // Handlingsplan
  if (data.actionItems && data.actionItems.length > 0) {
    content += `HANDLINGSPLAN – ATT GÖRA
${'-'.repeat(40)}
`;
    data.actionItems.forEach(item => {
      const status = item.done ? '✓' : '☐';
      content += `  ${status} ${item.activity}${item.comment ? ` – ${item.comment}` : ''}\n`;
    });
    content += `\n`;
  }

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
  const currentDate = data.studentInfo.customDate 
    ? new Date(data.studentInfo.customDate).toLocaleDateString('sv-SE')
    : new Date().toLocaleDateString('sv-SE');
  const programName = data.studentInfo.program === 'D' ? 'Datateknik' : 'Infocom';
  const counselor = getCounselorById(data.studentInfo.counselorId);

  const sections: Paragraph[] = [];

  // Default paragraph spacing for single line spacing
  const defaultSpacing = {
    line: LINE_SPACING_SINGLE,
    lineRule: LineRuleType.AUTO,
    before: 60,
    after: 60,
  };

  // Header info - counselor contact
  sections.push(
    new Paragraph({
      children: [new TextRun({ 
        text: counselor?.displayName || 'STVL', 
        bold: true, 
        size: FONT_SIZE_NORMAL,
        font: FONT_NAME,
      })],
      spacing: defaultSpacing,
    }),
    new Paragraph({
      children: [new TextRun({ 
        text: counselor?.email || '', 
        size: FONT_SIZE_NORMAL,
        font: FONT_NAME,
        color: '444444',
      })],
      spacing: defaultSpacing,
    }),
    new Paragraph({ children: [], spacing: { after: 200 } }),
  );

  // Title
  sections.push(
    new Paragraph({
      children: [new TextRun({ 
        text: 'MINNESANTECKNINGAR – STUDIEPLANERING', 
        bold: true, 
        size: FONT_SIZE_HEADING1,
        font: FONT_NAME,
      })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 0, after: 300 },
    }),
  );

  // Basic info section
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Syfte: ', bold: true, size: FONT_SIZE_NORMAL, font: FONT_NAME }),
        new TextRun({ text: 'Studieplanering med studievägledare', size: FONT_SIZE_NORMAL, font: FONT_NAME }),
      ],
      spacing: defaultSpacing,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Datum: ', bold: true, size: FONT_SIZE_NORMAL, font: FONT_NAME }),
        new TextRun({ text: currentDate, size: FONT_SIZE_NORMAL, font: FONT_NAME }),
      ],
      spacing: defaultSpacing,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Student: ', bold: true, size: FONT_SIZE_NORMAL, font: FONT_NAME }),
        new TextRun({ text: data.studentInfo.name || '—', size: FONT_SIZE_NORMAL, font: FONT_NAME }),
      ],
      spacing: defaultSpacing,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Program och kull: ', bold: true, size: FONT_SIZE_NORMAL, font: FONT_NAME }),
        new TextRun({ text: `${programName}${data.studentInfo.yearGroup ? ` (${data.studentInfo.yearGroup})` : ''}`, size: FONT_SIZE_NORMAL, font: FONT_NAME }),
      ],
      spacing: defaultSpacing,
    }),
    new Paragraph({ children: [], spacing: { after: 200 } }),
  );

  // Agenda
  if (data.agenda) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'Agenda', bold: true, size: FONT_SIZE_HEADING2, font: FONT_NAME })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: data.agenda, size: FONT_SIZE_NORMAL, font: FONT_NAME })],
        spacing: defaultSpacing,
      }),
      new Paragraph({ children: [], spacing: { after: 200 } }),
    );
  }

  // Study planning section
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'Studieplanering', bold: true, size: FONT_SIZE_HEADING2, font: FONT_NAME })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
  );

  data.terms.forEach((term) => {
    const semesterLabel = term.customSemesterLabel || (term.semester === 'HT' ? 'Hösttermin' : 'Vårtermin');
    const period1Label = term.semester === 'HT' ? 'LP1' : 'LP3';
    const period2Label = term.semester === 'HT' ? 'LP2' : 'LP4';
    const lp1HP = calculatePeriodHP(term.lp1);
    const lp2HP = calculatePeriodHP(term.lp2);
    const termHP = calculateTermHP(term);
    const displayYear = term.customYearLabel || term.year;

    // Term header
    sections.push(
      new Paragraph({
        children: [new TextRun({ 
          text: `${semesterLabel} ${displayYear}`, 
          bold: true, 
          size: FONT_SIZE_HEADING3, 
          font: FONT_NAME 
        })],
        spacing: { before: 200, after: 60 },
      }),
    );

    // LP1/LP3 header
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `${period1Label} (${lp1HP.toFixed(2).replace(/\.?0+$/, '')} hp):`, italics: true, size: FONT_SIZE_NORMAL, font: FONT_NAME })],
        indent: { left: convertInchesToTwip(0.25) },
        spacing: defaultSpacing,
      }),
    );
    
    if (term.lp1.length === 0) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: '– Inga kurser planerade', size: FONT_SIZE_NORMAL, font: FONT_NAME })],
          indent: { left: convertInchesToTwip(0.5) },
          spacing: defaultSpacing,
        }),
      );
    } else {
      term.lp1.forEach(course => {
        const effectiveHP = course.studyPace && course.studyPace !== 100 
          ? (course.hp * course.studyPace / 100).toFixed(2).replace(/\.?0+$/, '')
          : course.hp.toString();
        const paceInfo = course.studyPace && course.studyPace !== 100 ? ` [${course.studyPace}%]` : '';
        const multiPeriodPrefix = course.isMultiPeriod ? '*' : '';
        const restkursInfo = course.completedHP && course.completedHP > 0 
          ? ` *Restkurs (${course.completedHP} hp avklarade, ${Math.max(0, course.hp - course.completedHP)} hp kvar)` : '';
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `– ${course.code}: ${multiPeriodPrefix}${course.name} (${effectiveHP} hp)${paceInfo}${restkursInfo}`, size: FONT_SIZE_NORMAL, font: FONT_NAME, bold: !!paceInfo }),
              course.isCustom ? new TextRun({ text: ' [Egen kurs]', italics: true, size: FONT_SIZE_NORMAL, font: FONT_NAME }) : new TextRun({ text: '' }),
            ],
            indent: { left: convertInchesToTwip(0.5) },
            spacing: defaultSpacing,
          }),
        );
      });
    }

    // LP2/LP4 header
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `${period2Label} (${lp2HP.toFixed(2).replace(/\.?0+$/, '')} hp):`, italics: true, size: FONT_SIZE_NORMAL, font: FONT_NAME })],
        indent: { left: convertInchesToTwip(0.25) },
        spacing: defaultSpacing,
      }),
    );
    
    if (term.lp2.length === 0) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: '– Inga kurser planerade', size: FONT_SIZE_NORMAL, font: FONT_NAME })],
          indent: { left: convertInchesToTwip(0.5) },
          spacing: defaultSpacing,
        }),
      );
    } else {
      term.lp2.forEach(course => {
        const effectiveHP = course.studyPace && course.studyPace !== 100 
          ? (course.hp * course.studyPace / 100).toFixed(2).replace(/\.?0+$/, '')
          : course.hp.toString();
        const paceInfo = course.studyPace && course.studyPace !== 100 ? ` [${course.studyPace}%]` : '';
        const multiPeriodPrefix = course.isMultiPeriod ? '*' : '';
        const restkursInfo = course.completedHP && course.completedHP > 0 
          ? ` *Restkurs (${course.completedHP} hp avklarade, ${Math.max(0, course.hp - course.completedHP)} hp kvar)` : '';
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `– ${course.code}: ${multiPeriodPrefix}${course.name} (${effectiveHP} hp)${paceInfo}${restkursInfo}`, size: FONT_SIZE_NORMAL, font: FONT_NAME, bold: !!paceInfo }),
              course.isCustom ? new TextRun({ text: ' [Egen kurs]', italics: true, size: FONT_SIZE_NORMAL, font: FONT_NAME }) : new TextRun({ text: '' }),
            ],
            indent: { left: convertInchesToTwip(0.5) },
            spacing: defaultSpacing,
          }),
        );
      });
    }

    // Term total
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `Totalt denna termin: ${termHP.toFixed(2).replace(/\.?0+$/, '')} hp`, bold: true, size: FONT_SIZE_NORMAL, font: FONT_NAME })],
        indent: { left: convertInchesToTwip(0.25) },
        spacing: { ...defaultSpacing, before: 100 },
      }),
    );

    // Retake exam notes
    if (term.retakeExamNotes) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Omtentamensperiod: ', italics: true, size: FONT_SIZE_NORMAL, font: FONT_NAME }),
            new TextRun({ text: term.retakeExamNotes, size: FONT_SIZE_NORMAL, font: FONT_NAME }),
          ],
          indent: { left: convertInchesToTwip(0.25) },
          spacing: defaultSpacing,
        }),
      );
    }
  });

  sections.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Handlingsplan
  if (data.actionItems && data.actionItems.length > 0) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'Handlingsplan – Att göra', bold: true, size: FONT_SIZE_HEADING2, font: FONT_NAME })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
    );
    data.actionItems.forEach(item => {
      const status = item.done ? '✓' : '☐';
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${status}  ${item.activity}`, size: FONT_SIZE_NORMAL, font: FONT_NAME, bold: item.done }),
            item.comment ? new TextRun({ text: ` – ${item.comment}`, italics: true, size: FONT_SIZE_NORMAL, font: FONT_NAME }) : new TextRun({ text: '' }),
          ],
          indent: { left: convertInchesToTwip(0.25) },
          spacing: defaultSpacing,
        }),
      );
    });
    sections.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  // Notes
  if (data.notes) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'Övriga anteckningar', bold: true, size: FONT_SIZE_HEADING2, font: FONT_NAME })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: data.notes, size: FONT_SIZE_NORMAL, font: FONT_NAME })],
        spacing: defaultSpacing,
      }),
      new Paragraph({ children: [], spacing: { after: 200 } }),
    );
  }

  // Exam info (mandatory) - new page
  sections.push(
    new Paragraph({
      children: [],
      pageBreakBefore: true,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Utbildningens upplägg och examenskrav', bold: true, size: FONT_SIZE_HEADING2, font: FONT_NAME })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 0, after: 200 },
    }),
  );

  // Intro text
  sections.push(
    new Paragraph({
      children: [new TextRun({ 
        text: 'Din civilingenjörsexamen på 300 hp ska innehålla kurser enligt nedan. Dessa krav är inte behörighetskrav för att få påbörja ett examensarbete.',
        size: FONT_SIZE_NORMAL,
        font: FONT_NAME,
      })],
      spacing: { ...defaultSpacing, after: 150 },
    }),
  );

  // Requirements list
  const requirements = [
    'Obligatoriska kurser – ca 180 hp (Åk 1–3)',
    'Kurser i specialisering – minst 45 hp, varav minst 30 hp på A-nivå (Åk 4–5)',
    'Valfria kurser – ca 45 hp, varav max 15 hp externt valfria (Åk 4–5)',
    'Examensarbete – 30 hp på A-nivå (Åk 5)',
  ];

  requirements.forEach(req => {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `• ${req}`, size: FONT_SIZE_NORMAL, font: FONT_NAME })],
        indent: { left: convertInchesToTwip(0.25) },
        spacing: defaultSpacing,
      }),
    );
  });

  sections.push(new Paragraph({ children: [], spacing: { after: 150 } }));

  // Year-specific requirements
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'För studenter antagna:', bold: true, size: FONT_SIZE_NORMAL, font: FONT_NAME })],
      spacing: { ...defaultSpacing, before: 150 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '• 2023 eller tidigare: minst 75 hp på A-nivå', size: FONT_SIZE_NORMAL, font: FONT_NAME })],
      indent: { left: convertInchesToTwip(0.25) },
      spacing: defaultSpacing,
    }),
    new Paragraph({
      children: [new TextRun({ text: '• 2024 eller senare: minst 90 hp på A-nivå', size: FONT_SIZE_NORMAL, font: FONT_NAME })],
      indent: { left: convertInchesToTwip(0.25) },
      spacing: defaultSpacing,
    }),
    new Paragraph({ children: [], spacing: { after: 150 } }),
  );

  // Clarifications
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'Förtydliganden:', bold: true, size: FONT_SIZE_NORMAL, font: FONT_NAME })],
      spacing: { ...defaultSpacing, before: 150 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '• Kurser i specialisering betraktas som valfria kurser', size: FONT_SIZE_NORMAL, font: FONT_NAME })],
      indent: { left: convertInchesToTwip(0.25) },
      spacing: defaultSpacing,
    }),
    new Paragraph({
      children: [new TextRun({ text: '• Max 15 hp får vara externt valfria', size: FONT_SIZE_NORMAL, font: FONT_NAME })],
      indent: { left: convertInchesToTwip(0.25) },
      spacing: defaultSpacing,
    }),
    new Paragraph({
      children: [new TextRun({ text: '• Endast avslutade kurser med slutbetyg kan ingå i examen', size: FONT_SIZE_NORMAL, font: FONT_NAME })],
      indent: { left: convertInchesToTwip(0.25) },
      spacing: defaultSpacing,
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_NAME,
            size: FONT_SIZE_NORMAL,
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: sections,
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [new TextRun({ 
                  text: 'Studie- och karriärvägledningen LTH', 
                  size: FONT_SIZE_SMALL,
                  font: FONT_NAME,
                })],
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
