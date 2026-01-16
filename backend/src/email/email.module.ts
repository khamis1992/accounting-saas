import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { EmailQueueProcessor } from './email-queue.processor';
import { EmailController } from './email.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailQueueProcessor],
  exports: [EmailService],
})
export class EmailModule {}
