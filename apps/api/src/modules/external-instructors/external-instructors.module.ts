import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExternalInstructorsService } from './external-instructors.service';
import { ExternalLecturesService } from './external-lectures.service';
import { ExternalReportService } from './external-report.service';
import { ExcelExportService } from './excel-export.service';
import { PdfExportService } from './pdf-export.service';
import { ExternalInstructorsController } from './external-instructors.controller';
import { ExternalLecturesController } from './external-lectures.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ExternalInstructorsController, ExternalLecturesController],
  providers: [
    ExternalInstructorsService,
    ExternalLecturesService,
    ExternalReportService,
    ExcelExportService,
    PdfExportService,
  ],
})
export class ExternalInstructorsModule {}
