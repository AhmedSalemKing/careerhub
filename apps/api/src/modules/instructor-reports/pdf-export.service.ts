import { Injectable } from '@nestjs/common';
import type { InstructorReport } from './instructor-reports.service';

@Injectable()
export class PdfExportService {
  async build(
    instructors: InstructorReport[],
    dateFrom?: string,
    dateTo?: string,
  ): Promise<Buffer> {
    const pdfMake = await import('pdfmake/build/pdfmake');
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    (pdfMake as any).vfs =
      (pdfFonts as any).pdfMake?.vfs ??
      (pdfFonts as any).default?.pdfMake?.vfs;

    const dateRange =
      dateFrom && dateTo
        ? `${dateFrom} — ${dateTo}`
        : dateFrom
          ? `من ${dateFrom}`
          : 'كل الفترات';

    const body: any[][] = [
      [
        { text: 'المحاضر', style: 'h' },
        { text: 'الكورس', style: 'h' },
        { text: 'المحاضرات', style: 'h' },
        { text: 'الساعات', style: 'h' },
      ],
    ];

    for (const r of instructors) {
      for (let i = 0; i < r.courses.length; i++) {
        const c = r.courses[i];
        const hours = (c.totalMinutes / 60).toFixed(1) + ' س';
        body.push([
          i === 0
            ? { text: r.nameAr, rowSpan: r.courses.length, bold: true }
            : {},
          c.courseName,
          { text: String(c.lectureCount), alignment: 'center' },
          { text: hours, alignment: 'center' },
        ]);
      }
      body.push([
        {
          text: 'إجمالي: ' + r.nameAr,
          colSpan: 2,
          bold: true,
          fillColor: '#ede9fe',
        },
        {},
        {
          text: String(r.totalLectures),
          bold: true,
          alignment: 'center',
          fillColor: '#ede9fe',
        },
        {
          text: (r.totalMinutes / 60).toFixed(1) + ' س',
          bold: true,
          alignment: 'center',
          fillColor: '#ede9fe',
        },
      ]);
    }

    const totL = instructors.reduce((s, r) => s + r.totalLectures, 0);
    const totM = instructors.reduce((s, r) => s + r.totalMinutes, 0);
    body.push([
      {
        text: 'الإجمالي الكلي',
        colSpan: 2,
        bold: true,
        fillColor: '#4f46e5',
        color: '#fff',
      },
      {},
      {
        text: String(totL),
        bold: true,
        alignment: 'center',
        fillColor: '#4f46e5',
        color: '#fff',
      },
      {
        text: (totM / 60).toFixed(1) + ' س',
        bold: true,
        alignment: 'center',
        fillColor: '#4f46e5',
        color: '#fff',
      },
    ]);

    const doc: any = {
      content: [
        { text: 'تقرير المحاضرين', style: 'title' },
        {
          text: `الفترة: ${dateRange}`,
          style: 'sub',
          margin: [0, 4, 0, 16],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', 'auto', 'auto'],
            body,
          },
          layout: {
            fillColor: (i: number) => (i === 0 ? '#6366f1' : null),
            hLineWidth: (i: number) => (i === 0 || i === 1 ? 2 : 0.5),
            vLineWidth: () => 0.5,
            hLineColor: () => '#6366f1',
            vLineColor: () => '#e5e7eb',
          },
        },
      ],
      styles: {
        title: { fontSize: 18, bold: true, alignment: 'center', color: '#1e1b4b' },
        sub: { fontSize: 11, alignment: 'center', color: '#6b7280' },
        h: { bold: true, color: '#fff' },
      },
      defaultStyle: { font: 'Roboto', fontSize: 10 },
    };

    return new Promise((resolve, reject) => {
      try {
        (pdfMake as any).createPdf(doc).getBuffer((buf: Buffer) => resolve(buf));
      } catch (e) {
        reject(e);
      }
    });
  }
}
