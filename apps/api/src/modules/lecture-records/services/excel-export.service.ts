import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { LectureReportService } from './lecture-report.service';
import { ReportFilterDto } from '../dto/report-filter.dto';

@Injectable()
export class ExcelExportService {
  constructor(private readonly reportService: LectureReportService) {}

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

    // Sheet 1: General summary
    const summarySheet = workbook.addWorksheet('ملخص عام');
    summarySheet.views = [{ rightToLeft: true }];
    summarySheet.columns = [
      { header: 'اسم المحاضر', key: 'instructorName', width: 32 },
      { header: 'إجمالي الدورات', key: 'totalCourses', width: 18 },
      { header: 'إجمالي المحاضرات', key: 'totalLectures', width: 20 },
      { header: 'إجمالي الساعات', key: 'hoursDisplay', width: 24 },
    ];

    const summaryHeader = summarySheet.getRow(1);
    summaryHeader.font = headerFont;
    summaryHeader.fill = headerFill;
    summaryHeader.alignment = { horizontal: 'right', vertical: 'middle' };
    summarySheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 4 } };
    summarySheet.views = [{ rightToLeft: true, state: 'frozen', xSplit: 0, ySplit: 1 }];

    for (const inst of report.instructors) {
      summarySheet.addRow({
        instructorName: inst.nameAr,
        totalCourses: inst.courses.length,
        totalLectures: inst.totalLectures,
        hoursDisplay: inst.hoursDisplay,
      });
    }

    // Sheet 2: Detailed per instructor/course
    const detailSheet = workbook.addWorksheet('تفصيلي');
    detailSheet.views = [{ rightToLeft: true }];
    detailSheet.columns = [
      { header: 'اسم المحاضر', key: 'instructorName', width: 32 },
      { header: 'اسم الدورة', key: 'courseName', width: 38 },
      { header: 'عدد المحاضرات', key: 'lectureCount', width: 18 },
      { header: 'إجمالي الساعات', key: 'hoursDisplay', width: 24 },
      { header: 'آخر محاضرة', key: 'lastDeliveredAt', width: 22 },
    ];

    const detailHeader = detailSheet.getRow(1);
    detailHeader.font = headerFont;
    detailHeader.fill = headerFill;
    detailHeader.alignment = { horizontal: 'right', vertical: 'middle' };
    detailSheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 5 } };
    detailSheet.views = [{ rightToLeft: true, state: 'frozen', xSplit: 0, ySplit: 1 }];

    let instructorIndex = 0;
    for (const inst of report.instructors) {
      const fillColor = instructorIndex % 2 === 0 ? 'FFF8F7FC' : 'FFFFFFFF';
      for (const course of inst.courses) {
        const row = detailSheet.addRow({
          instructorName: inst.nameAr,
          courseName: course.courseName,
          lectureCount: course.lectureCount,
          hoursDisplay: course.hoursDisplay,
          lastDeliveredAt: course.lastDeliveredAt
            ? new Date(course.lastDeliveredAt).toLocaleDateString('ar-EG')
            : '-',
        });
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor },
        };
        row.alignment = { horizontal: 'right', vertical: 'middle' };
      }
      instructorIndex += 1;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
