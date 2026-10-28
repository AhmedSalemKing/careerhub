import { Injectable } from '@nestjs/common';
import type { InstructorReport, ConsultantReport } from './instructor-reports.service';

// Use require() so CJS pdfmake loads reliably in the compiled NestJS dist.
// Dynamic import() can mis-resolve the vfs_fonts CJS exports and leave
// pdfMake.vfs undefined, which causes an immediate "font not found" crash.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfMakeLib = require('pdfmake/build/pdfmake');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfFontsLib = require('pdfmake/build/vfs_fonts');
pdfMakeLib.vfs = pdfFontsLib.pdfMake?.vfs ?? pdfFontsLib.vfs ?? {};

@Injectable()
export class PdfExportService {
  async build(
    instructors: InstructorReport[],
    consultants: ConsultantReport[],
    dateFrom?: string,
    dateTo?: string,
  ): Promise<Buffer> {
    console.log('[PDF] export start, instructors:', instructors.length, 'consultants:', consultants.length);
    const t0 = Date.now();

    if (!pdfMakeLib.vfs || Object.keys(pdfMakeLib.vfs).length === 0) {
      throw new Error('pdfmake vfs fonts not loaded — cannot generate PDF');
    }

    const dateRange =
      dateFrom && dateTo
        ? `${dateFrom} — ${dateTo}`
        : dateFrom
          ? `من ${dateFrom}`
          : 'كل الفترات';

    // Flat instructor summary — one row per instructor, no nested tables
    const instrBody: any[][] = [
      [
        { text: 'المحاضر', bold: true, fillColor: '#6366f1', color: '#fff' },
        { text: 'الكورسات', bold: true, fillColor: '#6366f1', color: '#fff' },
        { text: 'الدروس', bold: true, fillColor: '#6366f1', color: '#fff' },
        { text: 'ساعات التدريس', bold: true, fillColor: '#6366f1', color: '#fff' },
        { text: 'الطلاب', bold: true, fillColor: '#6366f1', color: '#fff' },
        { text: 'الايرادات', bold: true, fillColor: '#6366f1', color: '#fff' },
      ],
    ];
    for (const r of instructors) {
      const courseCount = (r as any).courseCount ??
        r.courses.filter((c: any) => c.courseId !== '__consulting__').length;
      const totalLessons = (r as any).totalLessons ?? r.totalLectures;
      instrBody.push([
        r.nameAr || r.nameEn || r.email,
        String(courseCount),
        String(totalLessons),
        r.hoursDisplay || '0 ساعة',
        String((r as any).totalStudents ?? 0),
        String((r as any).totalRevenue ?? 0),
      ]);
    }

    const content: any[] = [
      { text: 'تقرير المحاضرين', style: 'title' },
      { text: `الفترة: ${dateRange}`, style: 'sub', margin: [0, 4, 0, 16] },
      { text: 'قسم المحاضرين', style: 'sectionHeader', margin: [0, 0, 0, 8] },
      {
        table: {
          headerRows: 1,
          widths: [120, 50, 50, 70, 50, 60],
          body: instrBody,
        },
        layout: {
          hLineWidth: (i: number) => (i <= 1 ? 1.5 : 0.5),
          vLineWidth: () => 0.5,
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb',
        },
        margin: [0, 0, 0, 20],
      },
    ];

    if (consultants && consultants.length > 0) {
      const consBody: any[][] = [
        [
          { text: 'الاستشاري', bold: true, fillColor: '#7c3aed', color: '#fff' },
          { text: 'الجلسات', bold: true, fillColor: '#7c3aed', color: '#fff' },
          { text: 'مكتملة', bold: true, fillColor: '#7c3aed', color: '#fff' },
          { text: 'ملغاة', bold: true, fillColor: '#7c3aed', color: '#fff' },
          { text: 'اجمالي الساعات', bold: true, fillColor: '#7c3aed', color: '#fff' },
        ],
      ];
      for (const c of consultants) {
        consBody.push([
          c.nameAr || c.nameEn || c.email,
          String(c.sessionCount),
          String(c.completedCount),
          String(c.cancelledCount),
          c.hoursDisplay || '0 ساعة',
        ]);
      }
      content.push(
        { text: 'قسم الاستشاريين', style: 'sectionHeader', margin: [0, 0, 0, 8] },
        {
          table: {
            headerRows: 1,
            widths: [120, 50, 50, 50, 80],
            body: consBody,
          },
          layout: {
            hLineWidth: (i: number) => (i <= 1 ? 1.5 : 0.5),
            vLineWidth: () => 0.5,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb',
          },
        },
      );
    }

    const doc: any = {
      content,
      styles: {
        title: { fontSize: 18, bold: true, alignment: 'center', color: '#1e1b4b' },
        sub: { fontSize: 11, alignment: 'center', color: '#6b7280' },
        sectionHeader: { fontSize: 13, bold: true, color: '#1e1b4b' },
      },
      defaultStyle: { font: 'Roboto', fontSize: 10, alignment: 'right' },
    };

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('PDF generation timed out after 45s')),
        45000,
      );
      try {
        pdfMakeLib.createPdf(doc).getBuffer((buffer: Uint8Array) => {
          clearTimeout(timeout);
          resolve(Buffer.from(buffer));
        });
      } catch (e) {
        clearTimeout(timeout);
        console.error('[PDF] createPdf/getBuffer crash:', e);
        reject(e);
      }
    });

    console.log('[PDF] pdf built in', Date.now() - t0, 'ms');
    return pdfBuffer;
  }
}
