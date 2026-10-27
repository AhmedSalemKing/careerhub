import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Req, Res, HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExternalInstructorsService } from './external-instructors.service';
import { ExternalReportService } from './external-report.service';
import { ExcelExportService } from './excel-export.service';
import { PdfExportService } from './pdf-export.service';
import { CreateExternalInstructorDto } from './dto/create-external-instructor.dto';
import { UpdateExternalInstructorDto } from './dto/update-external-instructor.dto';
import { ReportFilterDto } from './dto/report-filter.dto';

@ApiTags('External Instructors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('external-instructors')
export class ExternalInstructorsController {
  constructor(
    private readonly instructorsService: ExternalInstructorsService,
    private readonly reportService: ExternalReportService,
    private readonly excelService: ExcelExportService,
    private readonly pdfService: PdfExportService,
  ) {}

  // Static routes MUST be declared before /:id

  @Get('report')
  @ApiOperation({ summary: 'Get instructor report (COMPLETED lectures only)' })
  async getReport(@Query() filter: ReportFilterDto) {
    return { success: true, data: await this.reportService.generateReport(filter) };
  }

  @Get('report/export/xlsx')
  @ApiOperation({ summary: 'Export report as Excel' })
  async exportXlsx(@Query() filter: ReportFilterDto, @Res() res: Response) {
    const buffer = await this.excelService.generateExcel(filter);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="external-instructors-report-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.status(HttpStatus.OK).end(buffer);
  }

  @Get('report/export/pdf')
  @ApiOperation({ summary: 'Export report as PDF' })
  async exportPdf(@Query() filter: ReportFilterDto, @Res() res: Response) {
    const buffer = await this.pdfService.generatePdf(filter);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="external-instructors-report-${Date.now()}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.status(HttpStatus.OK).end(buffer);
  }

  @Get()
  @ApiOperation({ summary: 'List all external instructors' })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return { success: true, data: await this.instructorsService.findAll(includeInactive === 'true') };
  }

  @Post()
  @ApiOperation({ summary: 'Create external instructor' })
  async create(@Body() dto: CreateExternalInstructorDto) {
    return { success: true, data: await this.instructorsService.create(dto) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one external instructor with their lectures' })
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.instructorsService.findOne(id) };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update external instructor' })
  async update(@Param('id') id: string, @Body() dto: UpdateExternalInstructorDto) {
    return { success: true, data: await this.instructorsService.update(id, dto) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete external instructor' })
  async remove(@Param('id') id: string) {
    await this.instructorsService.remove(id);
    return { success: true };
  }
}
