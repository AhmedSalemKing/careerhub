import { Module } from '@nestjs/common'
import { CertificatesController } from './certificates.controller'
import { CertificatesService } from './certificates.service'
import { PuppeteerService } from './puppeteer.service'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, PuppeteerService],
  exports: [CertificatesService],
})
export class CertificatesModule { }