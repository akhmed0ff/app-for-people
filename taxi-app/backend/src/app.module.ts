import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { appConfig } from './config/app.config';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { HealthModule } from './modules/health/health.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { TariffsModule } from './modules/tariffs/tariffs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnv,
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuthModule,
    DriversModule,
    TariffsModule,
    PricingModule,
    OrdersModule,
    RealtimeModule,
    HealthModule,
  ],
})
export class AppModule {}
