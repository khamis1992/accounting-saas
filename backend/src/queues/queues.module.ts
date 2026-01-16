import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueuesService } from './queues.service';
import { DepreciationProcessor } from './processors/depreciation.processor';
import { QueuesController } from './queues.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: 'depreciation',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
    SupabaseModule,
  ],
  controllers: [QueuesController],
  providers: [QueuesService, DepreciationProcessor],
  exports: [QueuesService],
})
export class QueuesModule {}
