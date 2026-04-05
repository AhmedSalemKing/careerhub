import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as fs from 'fs';
import * as path from 'path';
import * as sgMail from '@sendgrid/mail';
import { EmailJob, EmailTemplate, EMAIL_SUBJECTS } from './email.types';

function renderTemplate(template: EmailTemplate, context: Record<string, string>): string {
  const templateDir = path.join(__dirname, 'templates');
  const filePath = path.join(templateDir, `${template}.html`);

  let html: string;
  try {
    html = fs.readFileSync(filePath, 'utf8');
  } catch {
    // Fallback to plain text if template file not found
    return Object.entries(context)
      .reduce((acc, [k, v]) => acc + `<p>${k}: ${v}</p>`, '<html><body>') + '</body></html>';
  }

  // Replace {{VARIABLE}} placeholders with context values
  return Object.entries(context).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), value),
    html,
  );
}

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process()
  async processEmail(job: Job<EmailJob>): Promise<void> {
    const { to, template, context } = job.data;
    const fromEmail = process.env.FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'noreply@careerhub.com';
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY not set — skipping email delivery', { template, to });
      return;
    }

    sgMail.setApiKey(apiKey);

    try {
      await sgMail.send({
        to,
        from: fromEmail,
        subject: EMAIL_SUBJECTS[template],
        html: renderTemplate(template, context),
      });

      this.logger.log('Email delivered', { template, to });
    } catch (e) {
      this.logger.error('Email delivery failed', {
        template,
        to,
        attempt: job.attemptsMade,
        error: (e as Error).message,
      });
      throw e; // Re-throw so Bull retries
    }
  }
}
