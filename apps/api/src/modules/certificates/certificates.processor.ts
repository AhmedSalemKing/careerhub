import { Processor, Process } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { CertificatesService } from './certificates.service'

@Processor('certificates')
export class CertificatesProcessor {
  private readonly logger = new Logger(CertificatesProcessor.name)

  constructor(private readonly certificatesService: CertificatesService) {}

  @Process('generate')
  async handleGenerate(job: Job<{ userId: string; courseId: string }>) {
    const { userId, courseId } = job.data
    this.logger.log(`Auto-generating certificate for user=${userId} course=${courseId}`)
    try {
      await this.certificatesService.generateCertificate(userId, courseId)
      this.logger.log(`Certificate generated for user=${userId} course=${courseId}`)
    } catch (err: any) {
      this.logger.error(`Certificate generation failed: ${err.message}`, err.stack)
      throw err // let Bull retry if configured
    }
  }
}
