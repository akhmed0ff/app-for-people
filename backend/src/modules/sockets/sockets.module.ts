import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LocationModule } from '../location/location.module';
import { TaxiGateway } from './taxi.gateway';
import { TaxiRealtimeService } from './taxi-realtime.service';

@Module({
  imports: [JwtModule.register({}), LocationModule],
  providers: [TaxiGateway, TaxiRealtimeService],
})
export class SocketsModule {}
