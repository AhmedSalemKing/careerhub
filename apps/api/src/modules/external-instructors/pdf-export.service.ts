import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { ExternalReportService } from './external-report.service';
import { ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class PdfExportService {
  constructor(private readonly reportService: ExternalReportService) {}

  async generatePdf(filter: ReportFilterDto): Promise<Buffer> {
    const report = await this.reportService.generateReport(filter);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(18).text('External Instructors Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
      doc.moveDown(1);

      for (const inst of report) {
        doc.fontSize(13).text(`Instructor: ${inst.instructorName}`, { underline: true });
        doc.fontSize(10).text(`Total lectures: ${inst.totalLectures}  |  Total hours: ${inst.totalHours}`);
        doc.moveDown(0.3);

        // Course table header
        doc.fontSize(9).text('Course', 50, doc.y, { continued: true, width: 280 });
        doc.text('Lectures', 330, doc.y, { continued: true, width: 80 });
        doc.text('Hours', 410, doc.y, { width: 80 });
        doc.moveTo(50, doc.y).lineTo(490, doc.y).stroke();

        for (const course of inst.courses) {
          doc.text(course.courseTitle, 50, doc.y, { continued: true, width: 280 });
          doc.text(String(course.lectureCount), 330, doc.y, { continued: true, width: 80 });
          doc.text(String(course.totalHours), 410, doc.y, { width: 80 });
        }
        doc.moveDown(1);
      }

      doc.end();
    });
  }
}
