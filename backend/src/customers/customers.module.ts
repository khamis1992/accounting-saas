import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { PdfModule } from '../pdf/pdf.module';
import { AuditModule } from '../audit/audit.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [SupabaseModule, PdfModule, AuditModule, ExportModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
