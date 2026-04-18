import { Job } from 'bull';
import { EmailJob } from './email.types';
export declare class EmailProcessor {
    private readonly logger;
    processEmail(job: Job<EmailJob>): Promise<void>;
}
