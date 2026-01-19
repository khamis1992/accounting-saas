import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { DepreciationService } from './depreciation.service';
import { DepreciationController } from './depreciation.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AssetsController, DepreciationController],
  providers: [AssetsService, DepreciationService],
  exports: [AssetsService, DepreciationService],
})
export class AssetsModule {}
