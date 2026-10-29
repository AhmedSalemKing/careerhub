import { Injectable } from '@nestjs/common';
import { InstructorReportsService, CONSULTING_COURSE_ID, formatHours } from './instructor-reports.service';

@Injectable()
export class HtmlExportService {
  constructor(private readonly reportService: InstructorReportsService) {}

  async exportHtmlReport(
    dateFrom?: string,
    dateTo?: string,
    instructorId?: string,
    consultantId?: string,
  ): Promise<string> {
    const filter = { dateFrom, dateTo, instructorId };
    const report = await this.reportService.getCollectiveReport(filter);

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

    let instructors = report.instructors ?? [];
    let consultants = report.consultants ?? [];

    if (instructorId) {
      instructors = instructors.filter((i) => i.instructorId === instructorId);
    }

    if (consultantId) {
      consultants = consultants.filter((c) => c.consultantId === consultantId);
      instructors = [];
    }

    const totalCourses = new Set<string>();
    instructors.forEach((i) =>
      i.courses.forEach((c) => {
        if (c.courseId !== CONSULTING_COURSE_ID) totalCourses.add(c.courseId);
      }),
    );
    const totalStudents = instructors.reduce((s, i) => s + ((i as any).totalStudents ?? 0), 0);
    const totalRevenue = instructors.reduce((s, i) => s + ((i as any).totalRevenue ?? 0), 0)
      + consultants.reduce((s, c) => s + c.grossCollected, 0);
    const totalMinutes = instructors.reduce((s, i) => s + i.totalMinutes, 0)
      + consultants.reduce((s, c) => s + c.totalActualMinutes, 0);

    const instructorRows = instructors.map((i) => {
      const courseCount = (i as any).courseCount ?? i.courses.filter((c) => c.courseId !== CONSULTING_COURSE_ID).length;
      const totalLessons = (i as any).totalLessons ?? i.totalLectures;
      return `
        <tr>
          <td>${this.escape(i.nameAr || i.nameEn || i.email)}</td>
          <td>${this.escape(i.email)}</td>
          <td>${courseCount}</td>
          <td>${totalLessons}</td>
          <td>${this.escape(i.hoursDisplay || '—')}</td>
          <td>${(i as any).totalStudents ?? 0}</td>
          <td>${(i as any).totalRevenue ?? 0} ر.س</td>
        </tr>
      `;
    }).join('');

    const instructorDetailBlocks = instructors.map((i) => this.instructorBlock(i)).join('');

    const consultantRows = consultants.map((c) => `
      <tr>
        <td>${this.escape(c.nameAr || c.nameEn || c.email)}</td>
        <td>${this.escape(c.email)}</td>
        <td>${c.sessionCount}</td>
        <td>${c.completedCount}</td>
        <td>${c.cancelledCount}</td>
        <td>${this.escape(c.hoursDisplay || '—')}</td>
      </tr>
    `).join('');

    const consultantDetailBlocks = consultants.map((c) => this.consultantBlock(c)).join('');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>تقرير ديفواي — ${dateRangeText}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    text-align: right;
    color: #1a1a2e;
    background: #fff;
    font-size: 13px;
    line-height: 1.6;
  }

  @media print {
    body { font-size: 11px; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
    table { page-break-inside: avoid; }
  }

  .print-btn {
    position: fixed;
    top: 16px;
    left: 16px;
    background: #1B4F72;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    z-index: 1000;
  }

  .cover {
    text-align: center;
    padding: 60px 40px;
    border-bottom: 3px solid #1B4F72;
    margin-bottom: 40px;
  }

  .cover .logo-text {
    font-size: 36px;
    font-weight: 700;
    color: #1B4F72;
    letter-spacing: 2px;
  }

  .cover .subtitle {
    font-size: 18px;
    color: #555;
    margin-top: 8px;
  }

  .cover .period {
    margin-top: 24px;
    font-size: 15px;
    color: #333;
    background: #EBF5FB;
    display: inline-block;
    padding: 8px 24px;
    border-radius: 20px;
  }

  .stats-row {
    display: flex;
    justify-content: center;
    gap: 24px;
    flex-wrap: wrap;
    margin-top: 32px;
  }

  .stat-box {
    background: #1B4F72;
    color: white;
    border-radius: 10px;
    padding: 16px 28px;
    text-align: center;
    min-width: 120px;
  }

  .stat-box .num { font-size: 28px; font-weight: 700; }
  .stat-box .label { font-size: 12px; opacity: 0.85; margin-top: 4px; }

  .section {
    margin: 32px 0;
    padding: 0 24px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: #1B4F72;
    border-right: 4px solid #1B4F72;
    padding-right: 12px;
    margin-bottom: 16px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
    font-size: 12px;
  }

  th {
    background: #1B4F72;
    color: white;
    padding: 10px 12px;
    text-align: right;
    font-weight: 600;
  }

  td {
    padding: 8px 12px;
    border-bottom: 1px solid #dce6f1;
    text-align: right;
  }

  tr:nth-child(even) td { background: #EBF5FB; }

  .instructor-block, .consultant-block {
    border: 1px solid #dce6f1;
    border-radius: 8px;
    margin-bottom: 24px;
    overflow: hidden;
  }

  .instructor-header, .consultant-header {
    background: #2471A3;
    color: white;
    padding: 12px 16px;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .instructor-body, .consultant-body { padding: 16px; }

  .sub-title {
    font-size: 13px;
    font-weight: 700;
    color: #1B4F72;
    margin: 16px 0 8px;
  }

  .footer {
    text-align: center;
    padding: 24px;
    color: #888;
    font-size: 11px;
    border-top: 1px solid #dce6f1;
    margin-top: 40px;
  }
</style>
</head>
<body>

<button class="print-btn no-print" onclick="window.print()">طباعة / حفظ PDF</button>

<div class="cover">
  <div class="logo-text">DeveWay</div>
  <div class="subtitle">منصة ديفواي التعليمية</div>
  <div class="subtitle" style="margin-top:4px; font-size:14px;">تقرير المحاضرين والاستشاريين</div>
  <div class="period">الفترة: ${dateRangeText}</div>
  <div class="period" style="margin-right:8px; background:#d5f5e3;">تاريخ الإصدار: ${generatedAt}</div>

  <div class="stats-row">
    <div class="stat-box"><div class="num">${instructors.length}</div><div class="label">محاضرون</div></div>
    <div class="stat-box"><div class="num">${totalCourses.size}</div><div class="label">كورسات نشطة</div></div>
    <div class="stat-box"><div class="num">${totalStudents}</div><div class="label">طلاب</div></div>
    <div class="stat-box"><div class="num">${formatHours(totalMinutes)}</div><div class="label">إجمالي الساعات</div></div>
    <div class="stat-box"><div class="num">${totalRevenue} ر.س</div><div class="label">الإيرادات</div></div>
  </div>
</div>

${instructors.length > 0 ? `
<div class="section">
  <div class="section-title">قسم المحاضرين</div>

  <table>
    <thead>
      <tr>
        <th>المحاضر</th>
        <th>البريد</th>
        <th>الكورسات</th>
        <th>الدروس</th>
        <th>ساعات التدريس</th>
        <th>الطلاب</th>
        <th>الإيرادات</th>
      </tr>
    </thead>
    <tbody>
      ${instructorRows || '<tr><td colspan="7" style="text-align:center">لا يوجد محاضرين في الفترة المحددة</td></tr>'}
    </tbody>
  </table>

  ${instructorDetailBlocks}
</div>
` : ''}

${consultants.length > 0 ? `
<div class="page-break"></div>

<div class="section">
  <div class="section-title">قسم الاستشاريين</div>

  <table>
    <thead>
      <tr>
        <th>الاستشاري</th>
        <th>البريد</th>
        <th>إجمالي الجلسات</th>
        <th>مكتملة</th>
        <th>ملغاة</th>
        <th>إجمالي الساعات</th>
      </tr>
    </thead>
    <tbody>
      ${consultantRows || '<tr><td colspan="6" style="text-align:center">لا يوجد استشاريين في الفترة المحددة</td></tr>'}
    </tbody>
  </table>

  ${consultantDetailBlocks}
</div>
` : ''}

<div class="footer">
  تقرير صادر من منصة DeveWay — ${dateRangeText} — جميع الأرقام بالريال السعودي ما لم يُشر لغير ذلك
</div>

</body>
</html>`;
  }

  private instructorBlock(instructor: any): string {
    const courses = instructor.courses.filter((c: any) => c.courseId !== CONSULTING_COURSE_ID);
    const courseRows = courses.map((c: any) => {
      const revenue = c.grossSales ?? c.netRevenue ?? 0;
      const students = c.enrolledStudents ?? 0;
      const lessons = c.lessons?.length ?? c.lessonCount ?? c.lectureCount ?? 0;
      return `
        <tr>
          <td>${this.escape(c.courseName || c.courseTitle || c.courseId)}</td>
          <td>${lessons}</td>
          <td>${this.escape(c.hoursDisplay || '—')}</td>
          <td>${students}</td>
          <td>${revenue} ر.س</td>
          <td>${this.escape(this.formatDate(c.publishedAt ?? c.createdAt))}</td>
        </tr>
      `;
    }).join('');

    let lessonRows = '';
    courses.forEach((c: any) => {
      (c.lessons ?? []).forEach((lesson: any) => {
        if ((lesson.durationMinutes ?? 0) <= 0) return;
        lessonRows += `
          <tr>
            <td>${this.escape(c.courseName || c.courseTitle || c.courseId)}</td>
            <td>${this.escape(lesson.lessonTitle || '—')}</td>
            <td>${lesson.durationMinutes} دقيقة</td>
            <td>${this.escape(lesson.typeBadge || 'مسجل')}</td>
            <td>${this.escape(this.formatDate(lesson.lessonDate))}</td>
          </tr>
        `;
      });
    });

    return `
      <div class="instructor-block">
        <div class="instructor-header">
          <span>${this.escape(instructor.nameAr || instructor.nameEn || instructor.email)}</span>
          <span>${this.escape(instructor.hoursDisplay || '')}</span>
        </div>
        <div class="instructor-body">
          <div class="sub-title">الكورسات</div>
          <table>
            <thead>
              <tr>
                <th>الكورس</th>
                <th>الدروس</th>
                <th>المدة</th>
                <th>الطلاب</th>
                <th>الإيرادات</th>
                <th>تاريخ النشر</th>
              </tr>
            </thead>
            <tbody>
              ${courseRows || '<tr><td colspan="6" style="text-align:center">لا توجد كورسات نشطة في الفترة</td></tr>'}
            </tbody>
          </table>

          ${lessonRows ? `
            <div class="sub-title">تفصيل الدروس</div>
            <table>
              <thead>
                <tr>
                  <th>الكورس</th>
                  <th>الدرس</th>
                  <th>المدة</th>
                  <th>النوع</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>${lessonRows}</tbody>
            </table>
          ` : ''}
        </div>
      </div>
    `;
  }

  private consultantBlock(consultant: any): string {
    const sessionRows = (consultant.sessions ?? []).map((s: any) => `
      <tr>
        <td>${this.escape(s.sessionTitle)}</td>
        <td>${this.escape(s.topic || '—')}</td>
        <td>${this.escape(this.formatDate(s.scheduledAt))}</td>
        <td>${s.actualDurationMinutes} دقيقة</td>
        <td>${this.escape(s.sessionStatus)}</td>
        <td>${s.paidAmount ?? 0} ر.س</td>
      </tr>
    `).join('');

    return `
      <div class="consultant-block">
        <div class="consultant-header">
          <span>${this.escape(consultant.nameAr || consultant.nameEn || consultant.email)}</span>
          <span>${consultant.sessionCount} جلسة</span>
        </div>
        <div class="consultant-body">
          <div class="sub-title">تفصيل الجلسات</div>
          <table>
            <thead>
              <tr>
                <th>عنوان الجلسة</th>
                <th>الموضوع</th>
                <th>التاريخ</th>
                <th>المدة</th>
                <th>الحالة</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              ${sessionRows || '<tr><td colspan="6" style="text-align:center">لا توجد جلسات في الفترة المحددة</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  private escape(text: string | number | null | undefined): string {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private formatDate(value: Date | string | null | undefined): string {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';
    if (d.getFullYear() === 1970) return '—';
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
