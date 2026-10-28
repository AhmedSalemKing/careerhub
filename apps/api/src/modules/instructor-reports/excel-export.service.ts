import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ExchangeRateService } from '../../exchange-rate/exchange-rate.service';
import {
  InstructorReportsService,
  InstructorReport,
  CourseReport,
  ConsultantReport,
  ConsultantSessionDetail,
  formatHours,
  CONSULTING_COURSE_ID,
} from './instructor-reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';

const PRIMARY = 'FF1B4F72';
const ACCENT = 'FF2E86AB';
const LIGHT_BG = 'FFEBF5FB';
const WHITE = 'FFFFFFFF';
const DARK_TEXT = 'FF1A1A2E';
const GOLD = 'FFF39C12';
const BORDER = 'FFD5D5D5';

@Injectable()
export class ExcelExportService {
  constructor(
    private readonly reportService: InstructorReportsService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  async generateExcel(filter: ReportFilterDto, instructorId?: string): Promise<Buffer> {
    const mergedFilter = instructorId ? { ...filter, instructorId } : filter;
    const report = await this.reportService.getCollectiveReport(mergedFilter);

    const country = mergedFilter.country ?? undefined;
    const egpRate = country === 'EG'
      ? await this.exchangeRateService.getSARtoEGPRate().catch(() => 15.0027)
      : null;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DeveWay';
    workbook.created = new Date();
    workbook.lastModifiedBy = 'DeveWay';

    const dateFrom = mergedFilter.dateFrom ?? mergedFilter.from;
    const dateTo = mergedFilter.dateTo ?? mergedFilter.to;
    const dateRangeText = dateFrom && dateTo
      ? `من ${dateFrom} إلى ${dateTo}`
      : dateFrom
        ? `من ${dateFrom}`
        : dateTo
          ? `حتى ${dateTo}`
          : 'كل الفترات';

    const instructors = report.instructors ?? [];
    const consultants = report.consultants ?? [];

    const totalRevenueSAR = instructors.reduce((s, i) => s + ((i as any).totalRevenue ?? 0), 0)
      + consultants.reduce((s, c) => s + c.grossCollected, 0);

    this.buildSummarySheet(workbook, instructors, consultants, report, totalRevenueSAR, dateRangeText, country, egpRate);
    this.buildInstructorsSheet(workbook, instructors, dateRangeText, country, egpRate);
    this.buildCoursesSheet(workbook, instructors, dateRangeText, country, egpRate);
    this.buildLessonsSheet(workbook, instructors, dateRangeText);
    this.buildConsultantsSheet(workbook, consultants, dateRangeText);
    this.buildSessionsSheet(workbook, consultants, dateRangeText, country, egpRate);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private buildSummarySheet(
    workbook: ExcelJS.Workbook,
    instructors: InstructorReport[],
    consultants: ConsultantReport[],
    report: any,
    totalRevenueSAR: number,
    dateRangeText: string,
    country?: string,
    egpRate?: number | null,
  ) {
    const ws = workbook.addWorksheet('ملخص');
    this.setupSheet(ws, 2, dateRangeText);
    ws.columns = [
      { key: 'label', width: 28 },
      { key: 'value', width: 24 },
    ];

    const totalSessions = consultants.reduce((s, c) => s + c.sessionCount, 0);
    const rows = [
      { label: 'عدد المحاضرين', value: report.totalInstructors ?? instructors.length },
      { label: 'عدد الكورسات', value: report.totalCourses ?? 0 },
      { label: 'عدد الجلسات الاستشارية', value: totalSessions },
      { label: 'إجمالي الساعات', value: formatHours(report.totalMinutes ?? 0) },
      { label: 'إجمالي الإيرادات', value: this.formatCurrency(totalRevenueSAR, country, egpRate) },
      { label: 'تاريخ إصدار التقرير', value: new Date(report.generatedAt).toLocaleDateString('ar-EG') },
    ];

    rows.forEach((r, idx) => {
      const row = ws.addRow([r.label, r.value]);
      row.alignment = { horizontal: 'right', vertical: 'middle' };
      row.font = { name: 'Arial', size: 11, color: { argb: DARK_TEXT } };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: BORDER } },
          left: { style: 'thin', color: { argb: BORDER } },
          bottom: { style: 'thin', color: { argb: BORDER } },
          right: { style: 'thin', color: { argb: BORDER } },
        };
      });
      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BG } };
        });
      }
      if (r.label === 'إجمالي الإيرادات') {
        row.getCell(2).font = { name: 'Arial', size: 12, bold: true, color: { argb: DARK_TEXT } };
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
      }
    });
  }

  private buildInstructorsSheet(
    workbook: ExcelJS.Workbook,
    instructors: InstructorReport[],
    dateRangeText: string,
    country?: string,
    egpRate?: number | null,
  ) {
    const ws = workbook.addWorksheet('المحاضرون');
    const headers = ['الإيرادات', 'إجمالي الطلاب', 'إجمالي الساعات', 'إجمالي الدروس', 'عدد الكورسات', 'البريد الإلكتروني', 'اسم المحاضر'];
    this.setupSheet(ws, headers.length, dateRangeText);
    ws.columns = [
      { key: 'revenue', width: 16 },
      { key: 'students', width: 14 },
      { key: 'hours', width: 18 },
      { key: 'lessons', width: 14 },
      { key: 'courses', width: 14 },
      { key: 'email', width: 32 },
      { key: 'name', width: 32 },
    ];
    this.addHeaderRow(ws, headers);

    const filtered = instructors.filter((i) =>
      i.courses.some((c) => c.courseId !== CONSULTING_COURSE_ID),
    );

    let totalRevenue = 0;
    let totalStudents = 0;
    let totalMinutes = 0;
    let totalLessons = 0;
    let totalCourses = 0;

    filtered.forEach((inst, idx) => {
      const courseCount = (inst as any).courseCount ?? inst.courses.filter((c) => c.courseId !== CONSULTING_COURSE_ID).length;
      const lessons = (inst as any).totalLessons ?? inst.totalLectures;
      const minutes = (inst as any).totalTeachingMinutes ?? inst.totalMinutes;
      const revenue = (inst as any).totalRevenue ?? 0;
      const students = (inst as any).totalStudents ?? 0;

      totalRevenue += revenue;
      totalStudents += students;
      totalMinutes += minutes;
      totalLessons += lessons;
      totalCourses += courseCount;

      const row = ws.addRow({
        revenue: this.toCurrencyValue(revenue, country, egpRate),
        students,
        hours: formatHours(minutes),
        lessons,
        courses: courseCount,
        email: inst.email,
        name: inst.nameAr || inst.nameEn || inst.email,
      });
      this.styleDataRow(row, idx);
      row.getCell(1).numFmt = this.currencyNumFmt(country);
    });

    if (filtered.length > 0) {
      const totalRow = ws.addRow({
        revenue: this.toCurrencyValue(totalRevenue, country, egpRate),
        students: totalStudents,
        hours: formatHours(totalMinutes),
        lessons: totalLessons,
        courses: totalCourses,
        email: '',
        name: 'الإجمالي',
      });
      this.styleTotalRow(totalRow);
      totalRow.getCell(1).numFmt = this.currencyNumFmt(country);
    }
  }

  private buildCoursesSheet(
    workbook: ExcelJS.Workbook,
    instructors: InstructorReport[],
    dateRangeText: string,
    country?: string,
    egpRate?: number | null,
  ) {
    const ws = workbook.addWorksheet('الكورسات');
    const headers = ['تاريخ النشر', 'الإيرادات', 'الطلاب', 'المدة', 'عدد الدروس', 'الكورس', 'المحاضر'];
    this.setupSheet(ws, headers.length, dateRangeText);
    ws.columns = [
      { key: 'publishedAt', width: 18 },
      { key: 'revenue', width: 16 },
      { key: 'students', width: 12 },
      { key: 'duration', width: 18 },
      { key: 'lessons', width: 14 },
      { key: 'course', width: 40 },
      { key: 'instructor', width: 32 },
    ];
    this.addHeaderRow(ws, headers);

    let rowIdx = 0;
    instructors.forEach((inst) => {
      const courses = inst.courses.filter((c) => c.courseId !== CONSULTING_COURSE_ID);
      if (courses.length === 0) return;

      const groupRow = ws.addRow({ instructor: inst.nameAr || inst.nameEn || inst.email });
      ws.mergeCells(groupRow.number, 1, groupRow.number, headers.length);
      groupRow.alignment = { horizontal: 'right', vertical: 'middle' };
      groupRow.font = { name: 'Arial', bold: true, size: 11, color: { argb: WHITE } };
      groupRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT } };
      groupRow.height = 24;
      groupRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: BORDER } },
          left: { style: 'thin', color: { argb: BORDER } },
          bottom: { style: 'thin', color: { argb: BORDER } },
          right: { style: 'thin', color: { argb: BORDER } },
        };
      });

      courses.forEach((course) => {
        const revenue = (course as any).grossSales ?? (course as any).netRevenue ?? 0;
        const students = (course as any).enrolledStudents ?? 0;
        const lessons = (course as any).lessons?.length ?? course.lessonCount ?? course.lectureCount ?? 0;
        const row = ws.addRow({
          publishedAt: this.formatDate((course as any).publishedAt ?? course.createdAt),
          revenue: this.toCurrencyValue(revenue, country, egpRate),
          students,
          duration: course.hoursDisplay,
          lessons,
          course: course.courseName || course.courseTitle || course.courseId,
          instructor: inst.nameAr || inst.nameEn || inst.email,
        });
        this.styleDataRow(row, rowIdx);
        row.getCell(2).numFmt = this.currencyNumFmt(country);
        rowIdx += 1;
      });
    });
  }

  private buildLessonsSheet(
    workbook: ExcelJS.Workbook,
    instructors: InstructorReport[],
    dateRangeText: string,
  ) {
    const ws = workbook.addWorksheet('الدروس');
    const headers = ['النوع', 'المدة', 'الكورس', 'المحاضر'];
    this.setupSheet(ws, headers.length, dateRangeText);
    ws.columns = [
      { key: 'type', width: 14 },
      { key: 'duration', width: 14 },
      { key: 'course', width: 40 },
      { key: 'instructor', width: 32 },
    ];
    this.addHeaderRow(ws, headers);

    let rowIdx = 0;
    instructors.forEach((inst) => {
      inst.courses
        .filter((c) => c.courseId !== CONSULTING_COURSE_ID)
        .forEach((course) => {
          const lessons = (course as any).lessons ?? [];
          lessons
            .filter((lesson: any) => (lesson.durationMinutes ?? 0) > 0)
            .forEach((lesson: any) => {
              const row = ws.addRow({
                type: lesson.typeBadge || 'مسجل',
                duration: `${lesson.durationMinutes} دقيقة`,
                course: course.courseName || course.courseTitle || course.courseId,
                instructor: inst.nameAr || inst.nameEn || inst.email,
              });
              this.styleDataRow(row, rowIdx);
              rowIdx += 1;
            });
        });
    });
  }

  private buildConsultantsSheet(
    workbook: ExcelJS.Workbook,
    consultants: ConsultantReport[],
    dateRangeText: string,
  ) {
    const ws = workbook.addWorksheet('الاستشاريون');
    const headers = ['إجمالي الساعات', 'ملغاة', 'مكتملة', 'عدد الجلسات', 'البريد الإلكتروني', 'اسم الاستشاري'];
    this.setupSheet(ws, headers.length, dateRangeText);
    ws.columns = [
      { key: 'hours', width: 18 },
      { key: 'cancelled', width: 12 },
      { key: 'completed', width: 12 },
      { key: 'sessions', width: 14 },
      { key: 'email', width: 32 },
      { key: 'name', width: 32 },
    ];
    this.addHeaderRow(ws, headers);

    consultants.forEach((c, idx) => {
      const row = ws.addRow({
        hours: c.hoursDisplay,
        cancelled: c.cancelledCount,
        completed: c.completedCount,
        sessions: c.sessionCount,
        email: c.email,
        name: c.nameAr || c.nameEn || c.email,
      });
      this.styleDataRow(row, idx);
    });
  }

  private buildSessionsSheet(
    workbook: ExcelJS.Workbook,
    consultants: ConsultantReport[],
    dateRangeText: string,
    country?: string,
    egpRate?: number | null,
  ) {
    const ws = workbook.addWorksheet('الجلسات الاستشارية');
    const headers = ['المبلغ', 'الحالة', 'المدة', 'التاريخ', 'الموضوع', 'عنوان الجلسة', 'الاستشاري'];
    this.setupSheet(ws, headers.length, dateRangeText);
    ws.columns = [
      { key: 'amount', width: 16 },
      { key: 'status', width: 14 },
      { key: 'duration', width: 14 },
      { key: 'date', width: 18 },
      { key: 'topic', width: 28 },
      { key: 'session', width: 32 },
      { key: 'consultant', width: 32 },
    ];
    this.addHeaderRow(ws, headers);

    let rowIdx = 0;
    consultants.forEach((c) => {
      (c.sessions ?? [])
        .filter((s: ConsultantSessionDetail) => (s.sessionStatus === 'مكتملة' || (s.sessionStatus || '').toUpperCase() === 'COMPLETED'))
        .forEach((s: ConsultantSessionDetail) => {
          const row = ws.addRow({
            amount: this.toCurrencyValue(s.paidAmount ?? 0, country, egpRate),
            status: s.sessionStatus,
            duration: `${s.actualDurationMinutes} دقيقة`,
            date: this.formatDate(s.scheduledAt),
            topic: s.topic || '—',
            session: s.sessionTitle,
            consultant: c.nameAr || c.nameEn || c.email,
          });
          this.styleDataRow(row, rowIdx);
          row.getCell(1).numFmt = this.currencyNumFmt(country);
          rowIdx += 1;
        });
    });
  }

  private setupSheet(ws: ExcelJS.Worksheet, columnCount: number, dateRangeText: string) {
    ws.views = [{ rightToLeft: true, state: 'frozen', xSplit: 0, ySplit: 4 }];

    const titleRow = ws.addRow(['تقارير المحاضرين - DeveWay']);
    ws.mergeCells(titleRow.number, 1, titleRow.number, columnCount);
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.font = { name: 'Arial', bold: true, size: 16, color: { argb: WHITE } };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY } };
    titleRow.height = 32;

    const rangeRow = ws.addRow([dateRangeText]);
    ws.mergeCells(rangeRow.number, 1, rangeRow.number, columnCount);
    rangeRow.alignment = { horizontal: 'center', vertical: 'middle' };
    rangeRow.font = { name: 'Arial', size: 11, color: { argb: WHITE } };
    rangeRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT } };
    rangeRow.height = 22;

    ws.addRow([]);
  }

  private addHeaderRow(ws: ExcelJS.Worksheet, headers: string[]) {
    const row = ws.addRow(headers);
    row.alignment = { horizontal: 'center', vertical: 'middle' };
    row.font = { name: 'Arial', bold: true, size: 11, color: { argb: WHITE } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY } };
    row.height = 24;
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER } },
        left: { style: 'thin', color: { argb: BORDER } },
        bottom: { style: 'thin', color: { argb: BORDER } },
        right: { style: 'thin', color: { argb: BORDER } },
      };
    });
  }

  private styleDataRow(row: ExcelJS.Row, index: number) {
    row.alignment = { horizontal: 'right', vertical: 'middle' };
    row.font = { name: 'Arial', size: 10, color: { argb: DARK_TEXT } };
    row.height = 20;
    const fillColor = index % 2 === 0 ? WHITE : LIGHT_BG;
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER } },
        left: { style: 'thin', color: { argb: BORDER } },
        bottom: { style: 'thin', color: { argb: BORDER } },
        right: { style: 'thin', color: { argb: BORDER } },
      };
    });
  }

  private styleTotalRow(row: ExcelJS.Row) {
    row.alignment = { horizontal: 'right', vertical: 'middle' };
    row.font = { name: 'Arial', bold: true, size: 11, color: { argb: DARK_TEXT } };
    row.height = 24;
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER } },
        left: { style: 'thin', color: { argb: BORDER } },
        bottom: { style: 'medium', color: { argb: DARK_TEXT } },
        right: { style: 'thin', color: { argb: BORDER } },
      };
    });
  }

  private toCurrencyValue(amountSAR: number, country?: string, egpRate?: number | null): number {
    if (country === 'EG' && egpRate) {
      return Math.round((amountSAR * egpRate + Number.EPSILON) * 100) / 100;
    }
    return amountSAR;
  }

  private currencyNumFmt(country?: string): string {
    return country === 'EG' ? '#,##0 "ج.م"' : '#,##0 "ر.س"';
  }

  private formatCurrency(amountSAR: number, country?: string, egpRate?: number | null): string {
    const value = this.toCurrencyValue(amountSAR, country, egpRate);
    if (country === 'EG') {
      return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(value);
    }
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(value);
  }

  private formatDate(value: Date | string | null | undefined): string {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';
    if (d.getFullYear() === 1970) return '—';
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
