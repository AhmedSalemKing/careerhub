import { Injectable, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import type { InstructorReport, CourseReport, ConsultantReport, ConsultantSessionDetail } from './instructor-reports.service';
import { CONSULTING_COURSE_ID, formatHours } from './instructor-reports.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfMakeLib = require('pdfmake');

const PRIMARY = '#1B4F72';
const ACCENT = '#2E86AB';
const GOLD = '#F39C12';
const DARK = '#1A1A2E';
const GREY = '#6B7280';

@Injectable()
export class PdfExportService implements OnModuleInit {
  onModuleInit() {
    const fontPath = this.resolveFontPath();
    pdfMakeLib.setLocalAccessPolicy(() => true);
    pdfMakeLib.setUrlAccessPolicy(() => false);
    pdfMakeLib.setFonts({
      NotoSansArabic: {
        normal: fontPath,
        bold: fontPath,
        italics: fontPath,
        bolditalics: fontPath,
      },
    });
  }

  async build(
    instructors: InstructorReport[],
    consultants: ConsultantReport[],
    dateFrom?: string,
    dateTo?: string,
    instructorId?: string,
  ): Promise<Buffer> {
    const dateRangeText = dateFrom && dateTo
      ? `من ${dateFrom} إلى ${dateTo}`
      : dateFrom
        ? `من ${dateFrom}`
        : dateTo
          ? `حتى ${dateTo}`
          : 'كل الفترات';

    const generatedAt = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const content: any[] = [
      { text: 'DeveWay', style: 'brand' },
      { text: 'تقارير المحاضرين', style: 'title' },
      { text: `الفترة: ${dateRangeText}`, style: 'subtitle' },
      { text: `تاريخ الإصدار: ${generatedAt}`, style: 'subtitle', margin: [0, 0, 0, 16] },
    ];

    if (instructorId) {
      const instructor = instructors[0] ?? consultants[0];
      if (instructor) {
        content.push(
          { text: instructor.nameAr || instructor.nameEn || instructor.email, style: 'sectionTitle' },
          { text: instructor.email, style: 'subtitle', margin: [0, 0, 0, 12] },
        );
      }
      this.addStatsCards(content, this.singleInstructorStats(instructors[0], consultants[0]));
      this.addInstructorCoursesTable(content, instructors[0]);
      this.addInstructorLessonsTable(content, instructors[0]);
      this.addConsultingSessionsTable(content, consultants[0]);
    } else {
      this.addStatsCards(content, this.collectiveStats(instructors, consultants));
      this.addInstructorsTable(content, instructors);
      this.addConsultantsTable(content, consultants);
    }

    const docDefinition = {
      content,
      defaultStyle: { font: 'NotoSansArabic', alignment: 'right', fontSize: 10, color: DARK },
      styles: {
        brand: { fontSize: 11, color: GREY, alignment: 'center', margin: [0, 0, 0, 4] },
        title: { fontSize: 20, bold: true, color: PRIMARY, alignment: 'center', margin: [0, 0, 0, 6] },
        subtitle: { fontSize: 10, color: GREY, alignment: 'center' },
        sectionTitle: { fontSize: 14, bold: true, color: PRIMARY, margin: [0, 14, 0, 6] },
        sectionHeader: { fontSize: 13, bold: true, color: PRIMARY, margin: [0, 14, 0, 6] },
        cardValue: { fontSize: 18, bold: true, color: PRIMARY, alignment: 'center' },
        cardLabel: { fontSize: 9, color: GREY, alignment: 'center', margin: [0, 4, 0, 0] },
      },
      pageMargins: [40, 40, 40, 40],
    };

    const pdfDoc = pdfMakeLib.createPdf(docDefinition);
    const buffer = await pdfDoc.getBuffer();
    return Buffer.from(buffer);
  }

  private resolveFontPath(): string {
    const candidates = [
      path.join(__dirname, '..', '..', 'assets', 'fonts', 'NotoSansArabic-Regular.ttf'),
      path.join(process.cwd(), 'src', 'assets', 'fonts', 'NotoSansArabic-Regular.ttf'),
      path.join(process.cwd(), 'assets', 'fonts', 'NotoSansArabic-Regular.ttf'),
    ];
    const existing = candidates.find((p) => fs.existsSync(p));
    if (!existing) {
      throw new Error('NotoSansArabic font file not found. PDF Arabic rendering unavailable.');
    }
    return existing;
  }

  private collectiveStats(instructors: InstructorReport[], consultants: ConsultantReport[]) {
    const totalCourses = new Set<string>();
    instructors.forEach((i) =>
      i.courses.forEach((c) => {
        if (c.courseId !== CONSULTING_COURSE_ID) totalCourses.add(c.courseId);
      }),
    );
    const totalMinutes = instructors.reduce((s, i) => s + i.totalMinutes, 0)
      + consultants.reduce((s, c) => s + c.totalActualMinutes, 0);
    const totalSessions = consultants.reduce((s, c) => s + c.sessionCount, 0);
    return [
      { label: 'محاضر', value: instructors.length },
      { label: 'كورس', value: totalCourses.size },
      { label: 'جلسة', value: totalSessions },
      { label: 'ساعات', value: formatHours(totalMinutes) },
    ];
  }

  private singleInstructorStats(instructor?: InstructorReport, consultant?: ConsultantReport) {
    const courseCount = instructor
      ? (instructor as any).courseCount ?? instructor.courses.filter((c) => c.courseId !== CONSULTING_COURSE_ID).length
      : 0;
    const totalLessons = instructor ? ((instructor as any).totalLessons ?? instructor.totalLectures) : 0;
    const totalMinutes = (instructor?.totalMinutes ?? 0) + (consultant?.totalActualMinutes ?? 0);
    const totalRevenue = instructor ? ((instructor as any).totalRevenue ?? 0) : 0;
    return [
      { label: 'كورس', value: courseCount },
      { label: 'درس', value: totalLessons },
      { label: 'ساعات', value: formatHours(totalMinutes) },
      { label: 'إيرادات', value: `${totalRevenue} ر.س` },
    ];
  }

  private addStatsCards(content: any[], stats: { label: string; value: string | number }[]) {
    const body: any[][] = [
      stats.map((s) => ({ text: String(s.value), style: 'cardValue' })),
      stats.map((s) => ({ text: s.label, style: 'cardLabel' })),
    ];
    content.push({
      table: {
        headerRows: 0,
        widths: new Array(stats.length).fill('*'),
        body,
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 10,
        paddingBottom: () => 10,
        fillColor: () => '#EBF5FB',
      },
      margin: [0, 0, 0, 20],
    });
  }

  private addInstructorsTable(content: any[], instructors: InstructorReport[]) {
    if (instructors.length === 0) return;
    content.push({ text: 'قسم المحاضرين', style: 'sectionHeader' });
    const body: any[][] = [
      [
        this.tableHeader('المحاضر'),
        this.tableHeader('الكورسات'),
        this.tableHeader('الدروس'),
        this.tableHeader('ساعات التدريس'),
        this.tableHeader('الطلاب'),
        this.tableHeader('الإيرادات'),
      ],
    ];
    instructors.forEach((i) => {
      const courseCount = (i as any).courseCount ?? i.courses.filter((c) => c.courseId !== CONSULTING_COURSE_ID).length;
      const totalLessons = (i as any).totalLessons ?? i.totalLectures;
      body.push([
        i.nameAr || i.nameEn || i.email,
        String(courseCount),
        String(totalLessons),
        i.hoursDisplay || '—',
        String((i as any).totalStudents ?? 0),
        `${(i as any).totalRevenue ?? 0} ر.س`,
      ]);
    });
    content.push(this.table(body, ['*', 'auto', 'auto', 'auto', 'auto', 'auto']));
  }

  private addConsultantsTable(content: any[], consultants: ConsultantReport[]) {
    if (consultants.length === 0) return;
    content.push({ text: 'قسم الاستشاريين', style: 'sectionHeader', pageBreak: 'before' });
    const body: any[][] = [
      [
        this.tableHeader('الاستشاري'),
        this.tableHeader('الجلسات'),
        this.tableHeader('مكتملة'),
        this.tableHeader('ملغاة'),
        this.tableHeader('إجمالي الساعات'),
      ],
    ];
    consultants.forEach((c) => {
      body.push([
        c.nameAr || c.nameEn || c.email,
        String(c.sessionCount),
        String(c.completedCount),
        String(c.cancelledCount),
        c.hoursDisplay || '—',
      ]);
    });
    content.push(this.table(body, ['*', 'auto', 'auto', 'auto', 'auto']));
  }

  private addInstructorCoursesTable(content: any[], instructor?: InstructorReport) {
    if (!instructor) return;
    const courses = instructor.courses.filter((c) => c.courseId !== CONSULTING_COURSE_ID);
    if (courses.length === 0) return;
    content.push({ text: 'الكورسات', style: 'sectionHeader' });
    const body: any[][] = [
      [
        this.tableHeader('الكورس'),
        this.tableHeader('الدروس'),
        this.tableHeader('المدة'),
        this.tableHeader('الطلاب'),
        this.tableHeader('الإيرادات'),
        this.tableHeader('تاريخ النشر'),
      ],
    ];
    courses.forEach((c) => {
      const revenue = (c as any).grossSales ?? (c as any).netRevenue ?? 0;
      const students = (c as any).enrolledStudents ?? 0;
      const lessons = (c as any).lessons?.length ?? c.lessonCount ?? c.lectureCount ?? 0;
      body.push([
        c.courseName || c.courseTitle || c.courseId,
        String(lessons),
        c.hoursDisplay || '—',
        String(students),
        `${revenue} ر.س`,
        this.formatDate((c as any).publishedAt ?? c.createdAt),
      ]);
    });
    content.push(this.table(body, ['*', 'auto', 'auto', 'auto', 'auto', 'auto']));
  }

  private addInstructorLessonsTable(content: any[], instructor?: InstructorReport) {
    if (!instructor) return;
    const rows: any[] = [];
    instructor.courses
      .filter((c) => c.courseId !== CONSULTING_COURSE_ID)
      .forEach((c) => {
        ((c as any).lessons ?? []).forEach((lesson: any) => {
          if ((lesson.durationMinutes ?? 0) <= 0) return;
          rows.push([
            c.courseName || c.courseTitle || c.courseId,
            lesson.lessonTitle || '—',
            `${lesson.durationMinutes} دقيقة`,
            lesson.typeBadge || 'مسجل',
          ]);
        });
      });
    if (rows.length === 0) return;
    content.push({ text: 'الدروس', style: 'sectionHeader' });
    const body: any[][] = [
      [this.tableHeader('الكورس'), this.tableHeader('الدرس'), this.tableHeader('المدة'), this.tableHeader('النوع')],
    ];
    body.push(...rows);
    content.push(this.table(body, ['*', '*', 'auto', 'auto']));
  }

  private addConsultingSessionsTable(content: any[], consultant?: ConsultantReport) {
    if (!consultant || !consultant.sessions || consultant.sessions.length === 0) return;
    const completed = consultant.sessions.filter(
      (s: ConsultantSessionDetail) => s.sessionStatus === 'مكتملة' || (s.sessionStatus || '').toUpperCase() === 'COMPLETED',
    );
    if (completed.length === 0) return;
    content.push({ text: 'الجلسات الاستشارية', style: 'sectionHeader' });
    const body: any[][] = [
      [
        this.tableHeader('الاستشاري'),
        this.tableHeader('عنوان الجلسة'),
        this.tableHeader('الموضوع'),
        this.tableHeader('التاريخ'),
        this.tableHeader('المدة'),
        this.tableHeader('المبلغ'),
      ],
    ];
    completed.forEach((s: ConsultantSessionDetail) => {
      body.push([
        consultant.nameAr || consultant.nameEn || consultant.email,
        s.sessionTitle,
        s.topic || '—',
        this.formatDate(s.scheduledAt),
        `${s.actualDurationMinutes} دقيقة`,
        `${s.paidAmount ?? 0} ر.س`,
      ]);
    });
    content.push(this.table(body, ['*', '*', '*', 'auto', 'auto', 'auto']));
  }

  private tableHeader(text: string) {
    return { text, bold: true, color: '#fff', fillColor: PRIMARY, alignment: 'center' };
  }

  private table(body: any[][], widths: string[]) {
    return {
      table: {
        headerRows: 1,
        widths,
        body,
      },
      layout: {
        hLineWidth: (i: number) => (i <= 1 ? 1.5 : 0.5),
        vLineWidth: () => 0.5,
        hLineColor: () => '#e5e7eb',
        vLineColor: () => '#e5e7eb',
        fillColor: (i: number) => (i === 0 ? PRIMARY : i % 2 === 0 ? '#f8fafc' : null),
      },
      margin: [0, 0, 0, 16],
    };
  }

  private formatDate(value: Date | string | null | undefined): string {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';
    if (d.getFullYear() === 1970) return '—';
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
