import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module';
import { AdminPaymentsController } from './admin-payments.controller';
import { BalanceService } from './balance.service';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [PricingModule],
  controllers: [AdminPaymentsController],
  providers: [BalanceService, TransactionsService],
  exports: [BalanceService, TransactionsService],
})
export class BalanceModule {}
