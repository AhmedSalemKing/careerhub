import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { InstructorReportsService } from './instructor-reports.service';
import { ExcelExportService } from './excel-export.service';
import { PdfExportService } from './pdf-export.service';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { UpdateLectureDto } from './dto/update-lecture.dto';
import { ReportFilterDto } from './dto/report-filter.dto';

@ApiTags('Instructor Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('instructor-reports')
export class InstructorReportsController {
  constructor(
    private readonly reportService: InstructorReportsService,
    private readonly excelService: ExcelExportService,
    private readonly pdfService: PdfExportService,
  ) {}

  // Static routes must be declared before dynamic routes.

  @Get('report')
  @ApiOperation({ summary: 'Collective instructor report (COMPLETED lectures only)' })
  async getCollectiveReport(@Query() filter: ReportFilterDto) {
    const data = await this.reportService.getCollectiveReport(filter);
    return { success: true, data };
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export collective instructor report as Excel' })
  async exportExcel(@Query() filter: ReportFilterDto, @Res() res: Response) {
    await this.sendExcel(res, filter);
  }

  @Get('export/excel/consultant/:consultantId')
  @ApiOperation({ summary: 'Export single consultant report as Excel' })
  async exportExcelConsultant(
    @Param('consultantId') consultantId: string,
    @Query() filter: ReportFilterDto,
    @Res() res: Response,
  ) {
    await this.sendConsultantExcel(res, filter, consultantId);
  }

  @Get('export/excel/:instructorId')
  @ApiOperation({ summary: 'Export single instructor report as Excel' })
  async exportExcelSingle(
    @Param('instructorId') instructorId: string,
    @Query() filter: ReportFilterDto,
    @Res() res: Response,
  ) {
    await this.sendExcel(res, filter, instructorId);
  }

  @Get('export/pdf')
  @ApiOperation({ summary: 'Export collective instructor report as PDF' })
  async exportPdf(@Query() filter: ReportFilterDto, @Res() res: Response) {
    await this.sendPdf(res, filter);
  }

  @Get('export/pdf/consultant/:consultantId')
  @ApiOperation({ summary: 'Export single consultant report as PDF' })
  async exportPdfConsultant(
    @Param('consultantId') consultantId: string,
    @Query() filter: ReportFilterDto,
    @Res() res: Response,
  ) {
    await this.sendConsultantPdf(res, filter, consultantId);
  }

  @Get('export/pdf/:instructorId')
  @ApiOperation({ summary: 'Export single instructor report as PDF' })
  async exportPdfSingle(
    @Param('instructorId') instructorId: string,
    @Query() filter: ReportFilterDto,
    @Res() res: Response,
  ) {
    await this.sendPdf(res, filter, instructorId);
  }

  private async sendExcel(res: Response, filter: ReportFilterDto, instructorId?: string) {
    try {
      const buffer = await this.excelService.generateExcel(filter, instructorId);
      const suffix = instructorId ? `-${instructorId}` : '';
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="instructor-report${suffix}-${Date.now()}.xlsx"`,
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (e: any) {
      console.error('[Excel] export error:', e);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: e?.message || 'Excel export failed' });
      }
    }
  }

  private async sendPdf(res: Response, filter: ReportFilterDto, instructorId?: string) {
    try {
      const t0 = Date.now();
      const dateFrom = filter.dateFrom ?? filter.from;
      const dateTo = filter.dateTo ?? filter.to;
      const report = await this.reportService.getCollectiveReport({ ...filter, dateFrom, dateTo, instructorId });
      console.log('[PDF] data fetched in', Date.now() - t0, 'ms');
      const buffer = await this.pdfService.build(
        report.instructors,
        report.consultants ?? [],
        dateFrom,
        dateTo,
        instructorId,
      );
      console.log('[PDF] pdf built in', Date.now() - t0, 'ms');
      const suffix = instructorId ? `-${instructorId}` : '';
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="instructor-report${suffix}-${Date.now()}.pdf"`,
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (e: any) {
      console.error('[PDF] export error:', e);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: e?.message || 'PDF export failed' });
      }
    }
  }

  private async sendConsultantExcel(res: Response, filter: ReportFilterDto, consultantId: string) {
    try {
      const buffer = await this.excelService.generateConsultantExcel(filter, consultantId);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="consultant-report-${consultantId}-${Date.now()}.xlsx"`,
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (e: any) {
      console.error('[Excel] consultant export error:', e);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: e?.message || 'Consultant Excel export failed' });
      }
    }
  }

  private async sendConsultantPdf(res: Response, filter: ReportFilterDto, consultantId: string) {
    try {
      const dateFrom = filter.dateFrom ?? filter.from;
      const dateTo = filter.dateTo ?? filter.to;
      const consultant = await this.reportService.getConsultantReport(consultantId, filter);
      if (!consultant) {
        throw new NotFoundException('Consultant not found or has no sessions in the selected range');
      }
      const buffer = await this.pdfService.buildConsultant(consultant, dateFrom, dateTo);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="consultant-report-${consultantId}-${Date.now()}.pdf"`,
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (e: any) {
      console.error('[PDF] consultant export error:', e);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: e?.message || 'Consultant PDF export failed' });
      }
    }
  }

  @Get('report/instructor/:id')
  @ApiOperation({ summary: 'Individual instructor report with lecture list' })
  async getInstructorReport(
    @Param('id') id: string,
    @Query() filter: ReportFilterDto,
  ) {
    const data = await this.reportService.getInstructorReport(id, filter);
    return { success: true, data };
  }

  @Get('lectures')
  @ApiOperation({ summary: 'List lecture logs with filters' })
  async listLectures(@Query() filter: ReportFilterDto) {
    const data = await this.reportService.listLectures(filter);
    return { success: true, data };
  }

  @Post('lectures')
  @ApiOperation({ summary: 'Create a lecture log' })
  async createLecture(@Body() dto: CreateLectureDto) {
    const data = await this.reportService.createLecture(dto);
    return { success: true, data };
  }

  @Patch('lectures/:id')
  @ApiOperation({ summary: 'Update a lecture log' })
  async updateLecture(@Param('id') id: string, @Body() dto: UpdateLectureDto) {
    const data = await this.reportService.updateLecture(id, dto);
    return { success: true, data };
  }

  @Delete('lectures/:id')
  @ApiOperation({ summary: 'Delete a lecture log' })
  async deleteLecture(@Param('id') id: string) {
    await this.reportService.deleteLecture(id);
    return { success: true };
  }

  @Get('instructors')
  @ApiOperation({ summary: 'List active instructors and consultants' })
  async getInstructors() {
    const data = await this.reportService.getInstructors();
    return { success: true, data };
  }

  @Post('backfill-video-durations')
  @ApiOperation({ summary: 'Backfill VideoContent.duration from Cloudflare Stream for records with null/0 duration (admin only)' })
  async backfillVideoDurations() {
    const result = await this.reportService.backfillVideoDurations();
    return { success: true, data: result };
  }

  @Post('backfill-published-at')
  @ApiOperation({ summary: 'Backfill Course.publishedAt for published courses that are missing it (admin only)' })
  async backfillPublishedAt() {
    const result = await this.reportService.backfillPublishedAt();
    return { success: true, data: result };
  }
}
