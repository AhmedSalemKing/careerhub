import { Module } from '@nestjs/common';
import { CareerController } from './career.controller';
import { CareerService } from './career.service';
import { AssessmentService } from './assessment.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CareerController],
  providers: [CareerService, AssessmentService],
  exports: [CareerService, AssessmentService],
})
export class CareerModule {}
