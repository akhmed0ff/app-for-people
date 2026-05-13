import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module';
import { PushModule } from '../push/push.module';
import { MatchingService } from './matching.service';

@Module({
  imports: [PushModule, PricingModule],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
