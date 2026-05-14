import { Module, Optional } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { CertificatesController } from './certificates.controller'
import { CertificatesService } from './certificates.service'
import { CertificatesProcessor } from './certificates.processor'
import { PrismaModule } from '../../prisma/prisma.module'
import { AuditModule } from '../../common/services/audit.module'

const bullImports = process.env.REDIS_URL
  ? [BullModule.registerQueue({ name: 'certificates' })]
  : []

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    ...bullImports,
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService, ...(process.env.REDIS_URL ? [CertificatesProcessor] : [])],
  exports: [CertificatesService],
})
export class CertificatesModule {}
