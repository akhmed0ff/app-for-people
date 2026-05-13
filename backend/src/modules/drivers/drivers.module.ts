import { Module } from '@nestjs/common';
import { BalanceModule } from '../balance/balance.module';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';

@Module({ imports: [BalanceModule], controllers: [DriversController], providers: [DriversService] })
export class DriversModule {}
