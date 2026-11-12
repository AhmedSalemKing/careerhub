import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TracksService } from './tracks.service';
import { AdminTracksController, TracksController } from './tracks.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TracksController, AdminTracksController],
  providers: [TracksService],
  exports: [TracksService],
})
export class TracksModule {}
