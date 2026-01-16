import { Module } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { JournalsController } from './journals.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [SupabaseModule, ExportModule],
  controllers: [JournalsController],
  providers: [JournalsService],
  exports: [JournalsService],
})
export class JournalsModule {}
