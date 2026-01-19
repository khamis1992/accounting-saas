import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CompanySettingsController } from './company-settings.controller';
import { CompanySettingsService } from './company-settings.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    SupabaseModule,
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
    }),
  ],
  controllers: [CompanySettingsController],
  providers: [CompanySettingsService],
  exports: [CompanySettingsService],
})
export class SettingsModule {}
