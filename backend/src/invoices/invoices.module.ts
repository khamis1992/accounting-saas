import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { JournalsModule } from '../journals/journals.module';
import { PdfModule } from '../pdf/pdf.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [SupabaseModule, JournalsModule, PdfModule, ExportModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
