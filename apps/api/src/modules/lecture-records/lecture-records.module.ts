import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LectureRecordsController } from './controllers/lecture-records.controller';
import { LectureRecordsService } from './services/lecture-records.service';
import { LectureReportService } from './services/lecture-report.service';
import { ExcelExportService } from './services/excel-export.service';

@Module({
  imports: [PrismaModule],
  controllers: [LectureRecordsController],
  providers: [LectureRecordsService, LectureReportService, ExcelExportService],
})
export class LectureRecordsModule {}
