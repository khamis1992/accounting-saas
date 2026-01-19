import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { CoaModule } from './coa/coa.module';
import { JournalsModule } from './journals/journals.module';
import { FiscalPeriodsModule } from './fiscal-periods/fiscal-periods.module';
import { CustomersModule } from './customers/customers.module';
import { VendorsModule } from './vendors/vendors.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { BankingModule } from './banking/banking.module';
import { ExpensesModule } from './expenses/expenses.module';
import { AssetsModule } from './assets/assets.module';
import { VatModule } from './vat/vat.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { QueuesModule } from './queues/queues.module';
import { PdfModule } from './pdf/pdf.module';
import { EmailModule } from './email/email.module';
import { AppConfigModule } from './config/config.module';
import { SecurityModule } from './security/security.module';
import { HealthModule } from './health/health.module';
import { SettingsModule } from './settings/settings.module';
import { SecurityMiddleware, RequestLoggingMiddleware } from './common/middleware';

@Module({
  imports: [
    AppConfigModule,
    SecurityModule, // All security features (rate limiting, guards, pipes)
    SupabaseModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    RolesModule,
    CoaModule,
    JournalsModule,
    FiscalPeriodsModule,
    CustomersModule,
    VendorsModule,
    InvoicesModule,
    PaymentsModule,
    BankingModule,
    ExpensesModule,
    AssetsModule,
    VatModule,
    ReportsModule,
    DashboardModule,
    AuditModule,
    QueuesModule,
    PdfModule,
    EmailModule,
    HealthModule,
    SettingsModule,
  ],
  controllers: [],
  providers: [
    SecurityMiddleware,
    RequestLoggingMiddleware,
  ],
  exports: [
    SecurityMiddleware,
    RequestLoggingMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply security middleware to all routes
    consumer
      .apply(SecurityMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
