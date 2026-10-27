import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { InstructorReportsService } from './instructor-reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ExcelExportService {
  constructor(private readonly reportService: InstructorReportsService) {}

  async generateExcel(filter: ReportFilterDto): Promise<Buffer> {
    const report = await this.reportService.getCollectiveReport(filter);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DeveWay';
    workbook.created = new Date();

    const headerFont: Partial<ExcelJS.Font> = {
      bold: true,
      name: 'Arial',
      size: 12,
      color: { argb: 'FFFFFFFF' },
    };

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF5120C8' },
    };

    // Sheet 1 - General summary
    const summary = workbook.addWorksheet('ملخص عام');
    summary.views = [{ rightToLeft: true, state: 'frozen', xSplit: 0, ySplit: 1 }];
    summary.columns = [
      { header: 'اسم المحاضر', key: 'instructorName', width: 32 },
      { header: 'إجمالي الدورات', key: 'totalCourses', width: 18 },
      { header: 'إجمالي المحاضرات', key: 'totalLectures', width: 20 },
      { header: 'إجمالي الساعات', key: 'hoursDisplay', width: 26 },
    ];

    const summaryHeader = summary.getRow(1);
    summaryHeader.font = headerFont;
    summaryHeader.fill = headerFill;
    summaryHeader.alignment = { horizontal: 'right', vertical: 'middle' };
    summaryHeader.height = 24;

    for (const instructor of report.instructors) {
      const row = summary.addRow({
        instructorName: instructor.nameAr,
        totalCourses: instructor.courses.length,
        totalLectures: instructor.totalLectures,
        hoursDisplay: instructor.hoursDisplay,
      });
      row.alignment = { horizontal: 'right', vertical: 'middle' };
    }

    summary.addRow({
      instructorName: 'الإجمالي الكلي',
      totalCourses: report.totalCourses,
      totalLectures: report.totalLectures,
      hoursDisplay: this.formatHours(report.totalMinutes),
    }).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEDE9FE' },
      };
    });

    // Sheet 2 - Detailed per instructor/course
    const detail = workbook.addWorksheet('تفصيلي');
    detail.views = [{ rightToLeft: true, state: 'frozen', xSplit: 0, ySplit: 1 }];
    detail.columns = [
      { header: 'اسم المحاضر', key: 'instructorName', width: 32 },
      { header: 'اسم الدورة', key: 'courseName', width: 40 },
      { header: 'عدد المحاضرات', key: 'lectureCount', width: 18 },
      { header: 'إجمالي الساعات', key: 'hoursDisplay', width: 26 },
      { header: 'آخر محاضرة', key: 'lastDeliveredAt', width: 22 },
    ];

    const detailHeader = detail.getRow(1);
    detailHeader.font = headerFont;
    detailHeader.fill = headerFill;
    detailHeader.alignment = { horizontal: 'right', vertical: 'middle' };
    detailHeader.height = 24;

    let instructorIndex = 0;
    for (const instructor of report.instructors) {
      const fillColor = instructorIndex % 2 === 0 ? 'FFF8F7FC' : 'FFFFFFFF';
      for (const course of instructor.courses) {
        const row = detail.addRow({
          instructorName: instructor.nameAr,
          courseName: course.courseName,
          lectureCount: course.lectureCount,
          hoursDisplay: course.hoursDisplay,
          lastDeliveredAt: course.lastDeliveredAt
            ? new Date(course.lastDeliveredAt).toLocaleDateString('ar-EG')
            : '-',
        });
        row.alignment = { horizontal: 'right', vertical: 'middle' };
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor },
        };
      }
      instructorIndex += 1;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private formatHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ساعة`;
    if (hours === 0) return `${mins} دقيقة`;
    return `${hours} ساعة و${mins} دقيقة`;
  }
}
