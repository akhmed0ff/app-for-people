import { Module } from '@nestjs/common';
import { BalanceModule } from '../balance/balance.module';
import { MatchingModule } from '../matching/matching.module';
import { PricingModule } from '../pricing/pricing.module';
import { RoutingModule } from '../routing/routing.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [BalanceModule, MatchingModule, PricingModule, RoutingModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
