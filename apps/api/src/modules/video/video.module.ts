import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { CloudflareService } from './cloudflare.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VideoController],
  providers: [VideoService, CloudflareService],
  exports: [VideoService, CloudflareService],
})
export class VideoModule {}
