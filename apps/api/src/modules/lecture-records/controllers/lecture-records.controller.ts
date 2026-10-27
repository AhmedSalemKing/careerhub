import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { LectureRecordsService } from '../services/lecture-records.service';
import { LectureReportService } from '../services/lecture-report.service';
import { ExcelExportService } from '../services/excel-export.service';
import { CreateLectureRecordDto } from '../dto/create-lecture-record.dto';
import { UpdateLectureRecordDto } from '../dto/update-lecture-record.dto';
import { ReportFilterDto } from '../dto/report-filter.dto';

@ApiTags('Lecture Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('lecture-records')
export class LectureRecordsController {
  constructor(
    private readonly lectureRecordsService: LectureRecordsService,
    private readonly reportService: LectureReportService,
    private readonly excelService: ExcelExportService,
  ) {}

  // Static routes MUST be declared before /:id

  @Get('report')
  @ApiOperation({ summary: 'Get collective instructor report (COMPLETED only)' })
  async getReport(@Query() filter: ReportFilterDto) {
    const data = await this.reportService.getCollectiveReport(filter);
    return { success: true, data };
  }

  @Get('report/export/xlsx')
  @ApiOperation({ summary: 'Export report as Excel' })
  async exportXlsx(@Query() filter: ReportFilterDto, @Res() res: Response) {
    const buffer = await this.excelService.generateExcel(filter);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="lecture-report-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.status(HttpStatus.OK).end(buffer);
  }

  @Get()
  @ApiOperation({ summary: 'List lecture records with filters' })
  async findAll(
    @Query('instructorId') instructorId?: string,
    @Query('courseId') courseId?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const data = await this.lectureRecordsService.findAll({
      instructorId,
      courseId,
      status: status as any,
      dateFrom,
      dateTo,
    });
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Create lecture record' })
  async create(@Body() dto: CreateLectureRecordDto) {
    const data = await this.lectureRecordsService.create(dto);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one lecture record' })
  async findOne(@Param('id') id: string) {
    const data = await this.lectureRecordsService.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lecture record' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLectureRecordDto,
  ) {
    const data = await this.lectureRecordsService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lecture record' })
  async remove(@Param('id') id: string) {
    await this.lectureRecordsService.remove(id);
    return { success: true };
  }
}
