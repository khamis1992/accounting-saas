import { Module } from '@nestjs/common';
import { CoaService } from './coa.service';
import { CoaController } from './coa.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [SupabaseModule, ExportModule],
  controllers: [CoaController],
  providers: [CoaService],
  exports: [CoaService],
})
export class CoaModule {}
