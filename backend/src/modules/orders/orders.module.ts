import { Module } from '@nestjs/common';
import { BalanceModule } from '../balance/balance.module';
import { MatchingModule } from '../matching/matching.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({ imports: [BalanceModule, MatchingModule], controllers: [OrdersController], providers: [OrdersService] })
export class OrdersModule {}
