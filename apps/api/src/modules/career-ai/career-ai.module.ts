import { Module } from '@nestjs/common';
import { CareerAiController } from './career-ai.controller';
import { CareerAiService } from './career-ai.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CareerAiController],
  providers: [CareerAiService],
  exports: [CareerAiService],
})
export class CareerAiModule {}
