import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

interface CalculateDepreciationDto {
  tenantId: string;
  assetId?: string;
  asOfDate: Date;
  userId: string;
}

interface GenerateFinancialStatementsDto {
  tenantId: string;
  fiscalPeriodId: string;
  userId: string;
}

@Injectable()
export class QueuesService {
  constructor(
    @InjectQueue('depreciation') private depreciationQueue: Queue,
  ) {}

  async calculateDepreciation(dto: CalculateDepreciationDto) {
    return this.depreciationQueue.add(
      'calculate-depreciation',
      dto,
      {
        jobId: `depreciation-${dto.tenantId}-${Date.now()}`,
      },
    );
  }

  async calculateDepreciationForAllAssets(dto: CalculateDepreciationDto) {
    return this.depreciationQueue.add(
      'calculate-depreciation-all',
      dto,
      {
        jobId: `depreciation-all-${dto.tenantId}-${Date.now()}`,
      },
    );
  }

  async getDepreciationJobs(tenantId: string) {
    const jobs = await this.depreciationQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
    return jobs.filter(job => job.data.tenantId === tenantId);
  }

  async getDepreciationJobStatus(jobId: string) {
    const job = await this.depreciationQueue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    return {
      id: job.id,
      name: job.name,
      progress: job.progress,
      data: job.data,
      state: await job.getState(),
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }
}
