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

  @Get('report/export/pdf')
  @ApiOperation({ summary: 'Export instructor report as PDF' })
  async exportPdf(@Query() filter: ReportFilterDto, @Res() res: Response) {
    try {
      const t0 = Date.now();
      console.log('[PDF] export start');
      const dateFrom = filter.dateFrom ?? filter.from;
      const dateTo = filter.dateTo ?? filter.to;
      const report = await this.reportService.getCollectiveReport({ ...filter, dateFrom, dateTo });
      console.log('[PDF] data fetched in', Date.now() - t0, 'ms');
      const buffer = await this.pdfService.build(report.instructors, report.consultants ?? [], dateFrom, dateTo);
      console.log('[PDF] pdf built in', Date.now() - t0, 'ms');
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="instructor-report-${Date.now()}.pdf"`,
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

  @Get('report/export/xlsx')
  @ApiOperation({ summary: 'Export instructor report as Excel' })
  async exportXlsx(@Query() filter: ReportFilterDto, @Res() res: Response) {
    const buffer = await this.excelService.generateExcel(filter);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="instructor-report-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
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
}
