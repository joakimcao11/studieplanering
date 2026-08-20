import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import type { DocSection } from '@/components/export/ExportPreviewDialog';

export const exportSectionsAsTxt = (
  sections: DocSection[],
  fileBaseName: string,
  meta: { title: string; studentName?: string; date: string; program?: string },
) => {
  const lines: string[] = [];
  lines.push(meta.title.toUpperCase());
  lines.push('='.repeat(meta.title.length));
  lines.push('');
  if (meta.studentName) lines.push(`Namn: ${meta.studentName}`);
  if (meta.program) lines.push(`Program: ${meta.program}`);
  lines.push(`Datum: ${meta.date}`);
  lines.push('');

  for (const sec of sections) {
    if (sec.heading) {
      lines.push('');
      lines.push(sec.heading);
      lines.push('-'.repeat(sec.heading.length));
    }
    if (sec.type === 'table') {
      const colWidths = sec.columns.map((c, i) =>
        Math.max(c.length, ...sec.rows.map((r) => (r[i] || '').length)),
      );
      const fmt = (row: string[]) =>
        row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(' | ');
      lines.push(fmt(sec.columns));
      lines.push(colWidths.map((w) => '-'.repeat(w)).join('-+-'));
      for (const r of sec.rows) lines.push(fmt(r));
    } else if (sec.type === 'image') {
      lines.push(`[Bild: ${sec.caption || 'bifogad bild'}]`);
    } else {
      lines.push(sec.body);
    }

    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${fileBaseName}.txt`);
};

export const exportSectionsAsPdf = (
  sections: DocSection[],
  fileBaseName: string,
  meta: { title: string; studentName?: string; date: string; program?: string },
) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  let y = 56;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 40, 90);
  doc.text(meta.title, marginX, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90);
  const metaLine = [
    meta.studentName ? `Namn: ${meta.studentName}` : '',
    meta.program ? `Program: ${meta.program}` : '',
    `Datum: ${meta.date}`,
  ].filter(Boolean).join('   ·   ');
  doc.text(metaLine, marginX, y);
  y += 18;
  doc.setDrawColor(200);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 14;

  const ensureSpace = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 48) {
      doc.addPage();
      y = 56;
    }
  };

  for (const sec of sections) {
    if (sec.pageBreak && y > 60) {
      doc.addPage();
      y = 56;
    }
    if (sec.heading) {
      ensureSpace(28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(20, 40, 90);
      doc.text(sec.heading, marginX, y);
      y += 16;
    }

    if (sec.type === 'table') {
      autoTable(doc, {
        startY: y,
        head: [sec.columns],
        body: sec.rows,
        margin: { left: marginX, right: marginX },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: 30, overflow: 'linebreak' },
        headStyles: { fillColor: [230, 235, 245], textColor: [20, 40, 90], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 249, 251] },
      });
      // @ts-ignore - lastAutoTable is added by jspdf-autotable
      y = (doc as any).lastAutoTable.finalY + 14;
    } else if (sec.type === 'image') {
      const maxW = pageWidth - marginX * 2;
      const maxH = doc.internal.pageSize.getHeight() - y - 60;
      try {
        doc.addImage(sec.dataUrl, 'PNG', marginX, y, maxW, Math.min(maxH, maxW * 0.7), undefined, 'FAST');
        y += Math.min(maxH, maxW * 0.7) + 14;
      } catch {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text('(Bilden kunde inte bäddas in)', marginX, y);
        y += 16;
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(30);
      const wrapped = doc.splitTextToSize(sec.body || '', pageWidth - marginX * 2);
      for (const line of wrapped) {
        ensureSpace(16);
        doc.text(line, marginX, y);
        y += 14;
      }
      y += 6;
    }
  }


  doc.save(`${fileBaseName}.pdf`);
};