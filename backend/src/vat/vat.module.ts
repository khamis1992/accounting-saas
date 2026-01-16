import { Module } from '@nestjs/common';
import { VatService } from './vat.service';
import { VatController } from './vat.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [VatController],
  providers: [VatService],
  exports: [VatService],
})
export class VatModule {}
