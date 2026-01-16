import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [SupabaseModule, ExportModule],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
