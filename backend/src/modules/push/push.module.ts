import { Module } from '@nestjs/common';
import { ExpoPushService } from './expo-push.service';
import { PushController } from './push.controller';
import { PushService } from './push.service';

@Module({
  controllers: [PushController],
  providers: [ExpoPushService, PushService],
  exports: [PushService],
})
export class PushModule {}
