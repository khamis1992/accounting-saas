import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { SupabaseHealthIndicator } from './indicators/supabase.health';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [TerminusModule, SupabaseModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, SupabaseHealthIndicator],
  exports: [DatabaseHealthIndicator, SupabaseHealthIndicator],
})
export class HealthModule {}
