import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExternalLecturesService } from './external-lectures.service';
import { CreateExternalLectureDto } from './dto/create-external-lecture.dto';
import { UpdateExternalLectureDto } from './dto/update-external-lecture.dto';

@ApiTags('External Lectures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('external-lectures')
export class ExternalLecturesController {
  constructor(private readonly lecturesService: ExternalLecturesService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new external lecture' })
  async create(@Body() dto: CreateExternalLectureDto, @Req() req: any) {
    return { success: true, data: await this.lecturesService.create(dto, req.user.id) };
  }

  @Get()
  @ApiOperation({ summary: 'List external lectures with optional filters' })
  async findAll(
    @Query('instructorId') instructorId?: string,
    @Query('courseId') courseId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return {
      success: true,
      data: await this.lecturesService.findAll({ instructorId, courseId, dateFrom, dateTo }),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one external lecture' })
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.lecturesService.findOne(id) };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update external lecture' })
  async update(@Param('id') id: string, @Body() dto: UpdateExternalLectureDto) {
    return { success: true, data: await this.lecturesService.update(id, dto) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete external lecture' })
  async remove(@Param('id') id: string) {
    await this.lecturesService.remove(id);
    return { success: true };
  }
}
