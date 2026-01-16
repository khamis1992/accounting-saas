import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { JournalsModule } from '../journals/journals.module';
import { PdfModule } from '../pdf/pdf.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [SupabaseModule, JournalsModule, PdfModule, ExportModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
