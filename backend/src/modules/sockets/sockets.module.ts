import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BalanceModule } from '../balance/balance.module';
import { LocationModule } from '../location/location.module';
import { MatchingModule } from '../matching/matching.module';
import { PushModule } from '../push/push.module';
import { TaxiGateway } from './taxi.gateway';
import { TaxiRealtimeService } from './taxi-realtime.service';

@Module({
  imports: [JwtModule.register({}), LocationModule, PushModule, BalanceModule, MatchingModule],
  providers: [TaxiGateway, TaxiRealtimeService],
})
export class SocketsModule {}
