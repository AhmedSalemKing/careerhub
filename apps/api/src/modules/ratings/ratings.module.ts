import { Module } from '@nestjs/common';
import { RatingsController } from './ratings.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RatingsController],
})
export class RatingsModule {}
