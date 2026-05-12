import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PricingModule } from '../pricing/pricing.module';
import { TariffsModule } from '../tariffs/tariffs.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [DatabaseModule, TariffsModule, PricingModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
