import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

@ApiTags('expenses')
@Controller('expenses')
@ApiBearerAuth()
@UseGuards(TenantContextGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all expenses' })
  findAll(@TenantContext('tenantId') tenantId: string) {
    return this.expensesService.findAll(tenantId);
  }
}
