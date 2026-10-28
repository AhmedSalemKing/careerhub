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
const LIGHT_BG = '#EBF5FB';

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
    const dateRangeText = this.dateRangeText(dateFrom, dateTo);
    const generatedAt = this.formatDate(new Date());

    const content: any[] = [
      this.coverPage(dateRangeText, generatedAt, instructors, consultants),
      { text: '', pageBreak: 'after' },
    ];

    if (instructorId) {
      const instructor = instructors[0] ?? null;
      const consultant = consultants[0] ?? null;
      this.addSingleInstructorSection(content, instructor, consultant);
    } else {
      this.addInstructorsSection(content, instructors);
      if (consultants.length > 0) {
        content.push({ text: '', pageBreak: 'before' });
        this.addConsultantsSection(content, consultants);
      }
    }

    const docDefinition = {
      content,
      defaultStyle: { font: 'NotoSansArabic', alignment: 'right', fontSize: 10, color: DARK },
      styles: {
        brand: { fontSize: 12, color: GREY, alignment: 'center', margin: [0, 0, 0, 6] },
        title: { fontSize: 22, bold: true, color: PRIMARY, alignment: 'center', margin: [0, 0, 0, 8] },
        subtitle: { fontSize: 11, color: GREY, alignment: 'center', margin: [0, 0, 0, 4] },
        sectionTitle: { fontSize: 16, bold: true, color: PRIMARY, margin: [0, 14, 0, 8] },
        sectionHeader: { fontSize: 14, bold: true, color: PRIMARY, margin: [0, 12, 0, 6] },
        subSectionHeader: { fontSize: 12, bold: true, color: ACCENT, margin: [0, 10, 0, 4] },
        cardValue: { fontSize: 20, bold: true, color: PRIMARY, alignment: 'center' },
        cardLabel: { fontSize: 10, color: GREY, alignment: 'center', margin: [0, 4, 0, 0] },
        coverLine: { fontSize: 11, color: GREY, alignment: 'center', margin: [0, 2, 0, 2] },
      },
      pageMargins: [40, 70, 40, 60],
      header: (currentPage: number, pageCount: number) =>
        this.pageHeader(currentPage, pageCount, dateRangeText),
      footer: (currentPage: number, pageCount: number) =>
        this.pageFooter(currentPage, pageCount),
    };

    const pdfDoc = pdfMakeLib.createPdf(docDefinition);
    const buffer = await pdfDoc.getBuffer();
    return Buffer.from(buffer);
  }

  async buildConsultant(
    consultant: ConsultantReport,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<Buffer> {
    const dateRangeText = this.dateRangeText(dateFrom, dateTo);
    const generatedAt = this.formatDate(new Date());

    const content: any[] = [this.consultantCoverPage(consultant, dateRangeText, generatedAt)];

    if (consultant.sessions && consultant.sessions.length > 0) {
      content.push({ text: '', pageBreak: 'before' });
      this.addConsultantSessionsDetail(content, consultant);
    }

    const docDefinition = {
      content,
      defaultStyle: { font: 'NotoSansArabic', alignment: 'right', fontSize: 10, color: DARK },
      styles: {
        brand: { fontSize: 12, color: GREY, alignment: 'center', margin: [0, 0, 0, 6] },
        title: { fontSize: 22, bold: true, color: PRIMARY, alignment: 'center', margin: [0, 0, 0, 8] },
        subtitle: { fontSize: 11, color: GREY, alignment: 'center', margin: [0, 0, 0, 4] },
        sectionTitle: { fontSize: 16, bold: true, color: PRIMARY, margin: [0, 14, 0, 8] },
        sectionHeader: { fontSize: 14, bold: true, color: PRIMARY, margin: [0, 12, 0, 6] },
        cardValue: { fontSize: 20, bold: true, color: PRIMARY, alignment: 'center' },
        cardLabel: { fontSize: 10, color: GREY, alignment: 'center', margin: [0, 4, 0, 0] },
      },
      pageMargins: [40, 70, 40, 60],
      header: (currentPage: number, pageCount: number) =>
        this.pageHeader(currentPage, pageCount, dateRangeText),
      footer: (currentPage: number, pageCount: number) =>
        this.pageFooter(currentPage, pageCount),
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

  // pdfmake does not perform Arabic shaping/bidi, so we reverse Arabic strings
  // so they render right-to-left inside the LTR text engine.
  private rtl(text: string | number | null | undefined): string {
    if (text === null || text === undefined) return '';
    return String(text).split('').reverse().join('');
  }

  private dateRangeText(dateFrom?: string, dateTo?: string): string {
    return dateFrom && dateTo
      ? `من ${dateFrom} إلى ${dateTo}`
      : dateFrom
        ? `من ${dateFrom}`
        : dateTo
          ? `حتى ${dateTo}`
          : 'كل الفترات';
  }

  private pageHeader(currentPage: number, pageCount: number, dateRangeText: string) {
    if (currentPage === 1) return null;
    return {
      margin: [40, 20, 40, 0],
      columns: [
        {
          text: this.rtl(`DeveWay | تقارير المحاضرين | الفترة: ${dateRangeText}`),
          alignment: 'right',
          fontSize: 9,
          color: GREY,
        },
      ],
    };
  }

  private pageFooter(currentPage: number, pageCount: number) {
    return {
      margin: [40, 0, 40, 20],
      columns: [
        {
          text: this.rtl(`صفحة ${currentPage} من ${pageCount}`),
          alignment: 'center',
          fontSize: 9,
          color: GREY,
        },
      ],
    };
  }

  private coverPage(
    dateRangeText: string,
    generatedAt: string,
    instructors: InstructorReport[],
    consultants: ConsultantReport[],
  ) {
    const totalCourses = new Set<string>();
    instructors.forEach((i) =>
      i.courses.forEach((c) => {
        if (c.courseId !== CONSULTING_COURSE_ID) totalCourses.add(c.courseId);
      }),
    );
    const totalMinutes = instructors.reduce((s, i) => s + i.totalMinutes, 0)
      + consultants.reduce((s, c) => s + c.totalActualMinutes, 0);
    const totalSessions = consultants.reduce((s, c) => s + c.sessionCount, 0);

    return {
      stack: [
        { text: this.rtl('DeveWay'), style: 'brand' },
        { text: this.rtl('منصة ديفواي التعليمية'), style: 'subtitle' },
        { text: this.rtl('تقرير المحاضرين والاستشاريين'), style: 'title', margin: [0, 30, 0, 12] },
        { text: this.rtl(`الفترة: ${dateRangeText}`), style: 'subtitle' },
        { text: this.rtl(`تاريخ الإصدار: ${generatedAt}`), style: 'subtitle', margin: [0, 0, 0, 30] },
        this.statsCards([
          { label: this.rtl('محاضرون'), value: instructors.length },
          { label: this.rtl('كورسات'), value: totalCourses.size },
          { label: this.rtl('جلسات'), value: totalSessions },
          { label: this.rtl('ساعات'), value: this.rtl(formatHours(totalMinutes)) },
        ]),
      ],
      alignment: 'center',
      margin: [0, 80, 0, 0],
    };
  }

  private consultantCoverPage(
    consultant: ConsultantReport,
    dateRangeText: string,
    generatedAt: string,
  ) {
    return {
      stack: [
        { text: this.rtl('DeveWay'), style: 'brand' },
        { text: this.rtl('منصة ديفواي التعليمية'), style: 'subtitle' },
        { text: this.rtl('تقرير استشاري'), style: 'title', margin: [0, 30, 0, 12] },
        { text: this.rtl(`الفترة: ${dateRangeText}`), style: 'subtitle' },
        { text: this.rtl(`تاريخ الإصدار: ${generatedAt}`), style: 'subtitle', margin: [0, 0, 0, 20] },
        { text: this.rtl(consultant.nameAr || consultant.nameEn || consultant.email), style: 'sectionTitle', alignment: 'center' },
        { text: this.rtl(consultant.email), style: 'subtitle', margin: [0, 0, 0, 20] },
        this.statsCards([
          { label: this.rtl('جلسات'), value: consultant.sessionCount },
          { label: this.rtl('مكتملة'), value: consultant.completedCount },
          { label: this.rtl('ملغاة'), value: consultant.cancelledCount },
          { label: this.rtl('ساعات'), value: this.rtl(consultant.hoursDisplay) },
        ]),
      ],
      alignment: 'center',
      margin: [0, 80, 0, 0],
    };
  }

  private statsCards(stats: { label: string; value: string | number }[]) {
    const body: any[][] = [
      stats.map((s) => ({ text: this.rtl(String(s.value)), style: 'cardValue' })),
      stats.map((s) => ({ text: s.label, style: 'cardLabel' })),
    ];
    return {
      table: {
        headerRows: 0,
        widths: new Array(stats.length).fill('*'),
        body,
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 10,
        paddingRight: () => 10,
        paddingTop: () => 14,
        paddingBottom: () => 14,
        fillColor: () => LIGHT_BG,
      },
      margin: [0, 0, 0, 20],
    };
  }

  private addInstructorsSection(content: any[], instructors: InstructorReport[]) {
    if (instructors.length === 0) {
      content.push({ text: this.rtl('لا يوجد محاضرين في الفترة المحددة'), style: 'sectionTitle' });
      return;
    }

    content.push({ text: this.rtl('قسم المحاضرين'), style: 'sectionTitle' });

    const body: any[][] = [
      [
        this.tableHeader(this.rtl('المحاضر')),
        this.tableHeader(this.rtl('الكورسات')),
        this.tableHeader(this.rtl('الدروس')),
        this.tableHeader(this.rtl('ساعات التدريس')),
        this.tableHeader(this.rtl('الطلاب')),
        this.tableHeader(this.rtl('الإيرادات')),
      ],
    ];
    instructors.forEach((i) => {
      const courseCount = (i as any).courseCount ?? i.courses.filter((c) => c.courseId !== CONSULTING_COURSE_ID).length;
      const totalLessons = (i as any).totalLessons ?? i.totalLectures;
      body.push([
        this.rtl(i.nameAr || i.nameEn || i.email),
        this.rtl(String(courseCount)),
        this.rtl(String(totalLessons)),
        this.rtl(i.hoursDisplay || '—'),
        this.rtl(String((i as any).totalStudents ?? 0)),
        this.rtl(`${(i as any).totalRevenue ?? 0} ر.س`),
      ]);
    });
    content.push(this.table(body, ['*', 'auto', 'auto', 'auto', 'auto', 'auto']));

    instructors.forEach((instructor, idx) => {
      if (idx > 0) content.push({ text: '', pageBreak: 'before' });
      this.addSingleInstructorSection(content, instructor, null, true);
    });
  }

  private addSingleInstructorSection(
    content: any[],
    instructor: InstructorReport | null,
    consultant: ConsultantReport | null,
    skipHeader = false,
  ) {
    if (!instructor && !consultant) return;

    if (instructor) {
      if (!skipHeader) {
        content.push({ text: this.rtl(instructor.nameAr || instructor.nameEn || instructor.email), style: 'sectionTitle' });
        content.push({ text: this.rtl(instructor.email), style: 'subtitle', margin: [0, 0, 0, 12] });
      }

      const courseCount = (instructor as any).courseCount ?? instructor.courses.filter((c) => c.courseId !== CONSULTING_COURSE_ID).length;
      const totalLessons = (instructor as any).totalLessons ?? instructor.totalLectures;
      const totalMinutes = instructor.totalMinutes;
      const totalRevenue = (instructor as any).totalRevenue ?? 0;

      if (!skipHeader) {
        this.addStatsCards(content, [
          { label: this.rtl('كورس'), value: this.rtl(String(courseCount)) },
          { label: this.rtl('درس'), value: this.rtl(String(totalLessons)) },
          { label: this.rtl('ساعات'), value: this.rtl(formatHours(totalMinutes)) },
          { label: this.rtl('إيرادات'), value: this.rtl(`${totalRevenue} ر.س`) },
        ]);
      }

      this.addInstructorCoursesTable(content, instructor);
      this.addInstructorLessonsTable(content, instructor);
    }

    if (consultant && consultant.sessions && consultant.sessions.length > 0) {
      this.addConsultingSessionsTable(content, consultant);
    }
  }

  private addStatsCards(content: any[], stats: { label: string; value: string | number }[]) {
    content.push(this.statsCards(stats));
  }

  private addInstructorCoursesTable(content: any[], instructor: InstructorReport) {
    const courses = instructor.courses.filter((c) => c.courseId !== CONSULTING_COURSE_ID);
    if (courses.length === 0) return;
    content.push({ text: this.rtl('الكورسات'), style: 'sectionHeader' });
    const body: any[][] = [
      [
        this.tableHeader(this.rtl('الكورس')),
        this.tableHeader(this.rtl('الدروس')),
        this.tableHeader(this.rtl('المدة')),
        this.tableHeader(this.rtl('الطلاب')),
        this.tableHeader(this.rtl('الإيرادات')),
        this.tableHeader(this.rtl('تاريخ النشر')),
      ],
    ];
    courses.forEach((c) => {
      const revenue = (c as any).grossSales ?? (c as any).netRevenue ?? 0;
      const students = (c as any).enrolledStudents ?? 0;
      const lessons = (c as any).lessons?.length ?? c.lessonCount ?? c.lectureCount ?? 0;
      body.push([
        this.rtl(c.courseName || c.courseTitle || c.courseId),
        this.rtl(String(lessons)),
        this.rtl(c.hoursDisplay || '—'),
        this.rtl(String(students)),
        this.rtl(`${revenue} ر.س`),
        this.rtl(this.formatDate((c as any).publishedAt ?? c.createdAt)),
      ]);
    });
    content.push(this.table(body, ['*', 'auto', 'auto', 'auto', 'auto', 'auto']));
  }

  private addInstructorLessonsTable(content: any[], instructor: InstructorReport) {
    const rows: any[] = [];
    instructor.courses
      .filter((c) => c.courseId !== CONSULTING_COURSE_ID)
      .forEach((c) => {
        ((c as any).lessons ?? []).forEach((lesson: any) => {
          if ((lesson.durationMinutes ?? 0) <= 0) return;
          rows.push([
            this.rtl(c.courseName || c.courseTitle || c.courseId),
            this.rtl(lesson.lessonTitle || '—'),
            this.rtl(`${lesson.durationMinutes} دقيقة`),
            this.rtl(lesson.typeBadge || 'مسجل'),
            this.rtl(this.formatDate(lesson.lessonDate)),
          ]);
        });
      });
    if (rows.length === 0) return;
    content.push({ text: this.rtl('تفصيل الدروس'), style: 'sectionHeader' });
    const body: any[][] = [
      [
        this.tableHeader(this.rtl('الكورس')),
        this.tableHeader(this.rtl('الدرس')),
        this.tableHeader(this.rtl('المدة')),
        this.tableHeader(this.rtl('النوع')),
        this.tableHeader(this.rtl('التاريخ')),
      ],
    ];
    body.push(...rows);
    content.push(this.table(body, ['*', '*', 'auto', 'auto', 'auto']));
  }

  private addConsultingSessionsTable(content: any[], consultant: ConsultantReport) {
    if (!consultant.sessions || consultant.sessions.length === 0) return;
    content.push({ text: this.rtl('الجلسات الاستشارية'), style: 'sectionHeader' });
    const body: any[][] = [
      [
        this.tableHeader(this.rtl('عنوان الجلسة')),
        this.tableHeader(this.rtl('الموضوع')),
        this.tableHeader(this.rtl('التاريخ')),
        this.tableHeader(this.rtl('المدة')),
        this.tableHeader(this.rtl('الحالة')),
        this.tableHeader(this.rtl('المبلغ')),
      ],
    ];
    consultant.sessions.forEach((s: ConsultantSessionDetail) => {
      body.push([
        this.rtl(s.sessionTitle),
        this.rtl(s.topic || '—'),
        this.rtl(this.formatDate(s.scheduledAt)),
        this.rtl(`${s.actualDurationMinutes} دقيقة`),
        this.rtl(s.sessionStatus),
        this.rtl(`${s.paidAmount ?? 0} ر.س`),
      ]);
    });
    content.push(this.table(body, ['*', '*', 'auto', 'auto', 'auto', 'auto']));
  }

  private addConsultantsSection(content: any[], consultants: ConsultantReport[]) {
    content.push({ text: this.rtl('قسم الاستشاريين'), style: 'sectionTitle' });

    const body: any[][] = [
      [
        this.tableHeader(this.rtl('الاستشاري')),
        this.tableHeader(this.rtl('الجلسات')),
        this.tableHeader(this.rtl('مكتملة')),
        this.tableHeader(this.rtl('ملغاة')),
        this.tableHeader(this.rtl('إجمالي الساعات')),
      ],
    ];
    consultants.forEach((c) => {
      body.push([
        this.rtl(c.nameAr || c.nameEn || c.email),
        this.rtl(String(c.sessionCount)),
        this.rtl(String(c.completedCount)),
        this.rtl(String(c.cancelledCount)),
        this.rtl(c.hoursDisplay || '—'),
      ]);
    });
    content.push(this.table(body, ['*', 'auto', 'auto', 'auto', 'auto']));

    consultants.forEach((consultant, idx) => {
      content.push({ text: '', pageBreak: 'before' });
      content.push({ text: this.rtl(consultant.nameAr || consultant.nameEn || consultant.email), style: 'sectionTitle' });
      content.push({ text: this.rtl(consultant.email), style: 'subtitle', margin: [0, 0, 0, 12] });
      this.addConsultantSessionsDetail(content, consultant);
    });
  }

  private addConsultantSessionsDetail(content: any[], consultant: ConsultantReport) {
    if (!consultant.sessions || consultant.sessions.length === 0) {
      content.push({ text: this.rtl('لا توجد جلسات في الفترة المحددة'), style: 'sectionHeader' });
      return;
    }
    content.push({ text: this.rtl('تفصيل الجلسات'), style: 'sectionHeader' });
    const body: any[][] = [
      [
        this.tableHeader(this.rtl('عنوان الجلسة')),
        this.tableHeader(this.rtl('الموضوع')),
        this.tableHeader(this.rtl('التاريخ')),
        this.tableHeader(this.rtl('المدة')),
        this.tableHeader(this.rtl('الحالة')),
        this.tableHeader(this.rtl('المبلغ')),
      ],
    ];
    consultant.sessions.forEach((s: ConsultantSessionDetail) => {
      body.push([
        this.rtl(s.sessionTitle),
        this.rtl(s.topic || '—'),
        this.rtl(this.formatDate(s.scheduledAt)),
        this.rtl(`${s.actualDurationMinutes} دقيقة`),
        this.rtl(s.sessionStatus),
        this.rtl(`${s.paidAmount ?? 0} ر.س`),
      ]);
    });
    content.push(this.table(body, ['*', '*', 'auto', 'auto', 'auto', 'auto']));
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
