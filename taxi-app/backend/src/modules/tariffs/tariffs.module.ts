import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TariffsController } from './tariffs.controller';
import { TariffsService } from './tariffs.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TariffsController],
  providers: [TariffsService, RolesGuard],
  exports: [TariffsService],
})
export class TariffsModule {}
