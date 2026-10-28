import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InstructorReportsController } from './instructor-reports.controller';
import { InstructorReportsService } from './instructor-reports.service';
import { ExcelExportService } from './excel-export.service';
import { PdfExportService } from './pdf-export.service';

@Module({
  imports: [PrismaModule],
  controllers: [InstructorReportsController],
  providers: [InstructorReportsService, ExcelExportService, PdfExportService],
  exports: [InstructorReportsService],
})
export class InstructorReportsModule {}
