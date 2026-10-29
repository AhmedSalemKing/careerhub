import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExchangeRateService } from '../../exchange-rate/exchange-rate.service';
import { InstructorReportsController } from './instructor-reports.controller';
import { InstructorReportsService } from './instructor-reports.service';
import { ExcelExportService } from './excel-export.service';
import { PdfExportService } from './pdf-export.service';
import { HtmlExportService } from './html-export.service';

@Module({
  imports: [PrismaModule],
  controllers: [InstructorReportsController],
  providers: [InstructorReportsService, ExcelExportService, PdfExportService, HtmlExportService, ExchangeRateService],
  exports: [InstructorReportsService],
})
export class InstructorReportsModule {}
