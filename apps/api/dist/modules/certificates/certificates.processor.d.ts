import { Job } from 'bull';
import { CertificatesService } from './certificates.service';
export declare class CertificatesProcessor {
    private readonly certificatesService;
    private readonly logger;
    constructor(certificatesService: CertificatesService);
    handleGenerate(job: Job<{
        userId: string;
        courseId: string;
    }>): Promise<void>;
}
