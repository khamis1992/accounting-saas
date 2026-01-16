import { Module } from '@nestjs/common';
import { FiscalPeriodsService } from './fiscal-periods.service';
import { FiscalPeriodsController } from './fiscal-periods.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [FiscalPeriodsController],
  providers: [FiscalPeriodsService],
  exports: [FiscalPeriodsService],
})
export class FiscalPeriodsModule {}
