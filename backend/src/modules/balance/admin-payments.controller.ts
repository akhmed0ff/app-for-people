import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../../domain/auth/role.enum';
import { Roles } from '../../interfaces/http/decorators/roles.decorator';
import { RolesGuard } from '../../interfaces/http/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BalanceService } from './balance.service';
import { AdjustDriverBalanceDto, TopUpDriverDto } from './dto/balance-action.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('admin-payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/drivers')
export class AdminPaymentsController {
  constructor(
    private readonly balanceService: BalanceService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Post(':driverId/top-up')
  @Roles(Role.ADMIN)
  topUp(@Param('driverId') driverId: string, @Body() dto: TopUpDriverDto) {
    return this.balanceService.topUp(driverId, dto);
  }

  @Post(':driverId/adjust')
  @Roles(Role.ADMIN)
  adjust(@Param('driverId') driverId: string, @Body() dto: AdjustDriverBalanceDto) {
    return this.balanceService.adjust(driverId, dto);
  }

  @Get(':driverId/transactions')
  @Roles(Role.ADMIN)
  transactions(@Param('driverId') driverId: string) {
    return this.transactionsService.findForDriverId(driverId);
  }
}
