import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './application/health/health.module';
import { appConfig } from './infrastructure/config/app.config';
import { validateEnv } from './infrastructure/config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { ResponseInterceptor } from './interfaces/http/interceptors/response.interceptor';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BalanceModule } from './modules/balance/balance.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { LocationModule } from './modules/location/location.module';
import { MatchingModule } from './modules/matching/matching.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PassengersModule } from './modules/passengers/passengers.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { PushModule } from './modules/push/push.module';
import { RoutingModule } from './modules/routing/routing.module';
import { SocketsModule } from './modules/sockets/sockets.module';
import { TariffsModule } from './modules/tariffs/tariffs.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    DriversModule,
    PassengersModule,
    OrdersModule,
    TariffsModule,
    PricingModule,
    RoutingModule,
    PaymentsModule,
    BalanceModule,
    PushModule,
    AdminModule,
    LocationModule,
    MatchingModule,
    SocketsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
