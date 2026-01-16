import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BankingService } from './banking.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

@ApiTags('banking')
@Controller('banking')
@ApiBearerAuth()
@UseGuards(TenantContextGuard)
export class BankingController {
  constructor(private bankingService: BankingService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'Get all bank accounts' })
  findAllAccounts(@TenantContext('tenantId') tenantId: string) {
    return this.bankingService.findAllAccounts(tenantId);
  }

  @Get('accounts/:accountId/transactions')
  @ApiOperation({ summary: 'Get bank account transactions' })
  findTransactions(
    @Param('accountId') accountId: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.bankingService.findTransactions(accountId, tenantId);
  }
}
