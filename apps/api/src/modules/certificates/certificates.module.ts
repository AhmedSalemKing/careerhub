import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { CertificatesController } from './certificates.controller'
import { CertificatesService } from './certificates.service'
import { CertificatesProcessor } from './certificates.processor'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: 'certificates' }),
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService, CertificatesProcessor],
  exports: [CertificatesService],
})
export class CertificatesModule {}
