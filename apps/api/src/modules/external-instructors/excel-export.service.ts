import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ExternalReportService, InstructorReport } from './external-report.service';
import { ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ExcelExportService {
  constructor(private readonly reportService: ExternalReportService) {}

  async generateExcel(filter: ReportFilterDto): Promise<Buffer> {
    const report = await this.reportService.generateReport(filter);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'DeveWay';
    wb.created = new Date();

    // Sheet 1: Summary by instructor
    const summarySheet = wb.addWorksheet('ملخص المدربين');
    summarySheet.columns = [
      { header: 'المدرب', key: 'instructorName', width: 30 },
      { header: 'عدد المحاضرات', key: 'totalLectures', width: 18 },
      { header: 'إجمالي الساعات', key: 'totalHours', width: 18 },
    ];
    summarySheet.getRow(1).font = { bold: true };
    for (const row of report) {
      summarySheet.addRow({
        instructorName: row.instructorName,
        totalLectures: row.totalLectures,
        totalHours: row.totalHours,
      });
    }

    // Sheet 2: Details per instructor/course
    const detailSheet = wb.addWorksheet('التفاصيل');
    detailSheet.columns = [
      { header: 'المدرب', key: 'instructorName', width: 30 },
      { header: 'الكورس', key: 'courseTitle', width: 35 },
      { header: 'عدد المحاضرات', key: 'lectureCount', width: 18 },
      { header: 'الساعات', key: 'totalHours', width: 15 },
    ];
    detailSheet.getRow(1).font = { bold: true };
    for (const inst of report) {
      for (const course of inst.courses) {
        detailSheet.addRow({
          instructorName: inst.instructorName,
          courseTitle: course.courseTitle,
          lectureCount: course.lectureCount,
          totalHours: course.totalHours,
        });
      }
    }

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
