import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailService, EmailOptions } from './email.service';

@Processor('email')
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('send-email')
  async handleEmail(job: Job<EmailOptions>) {
    this.logger.log(`Processing email job ${job.id} to ${job.data.to}`);
    return this.emailService.sendEmail(job.data);
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Completed job ${job.id}: ${JSON.stringify(result)}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Failed job ${job.id}: ${error.message}`,
      error.stack,
    );
  }
}
