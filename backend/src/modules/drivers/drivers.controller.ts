import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../../domain/auth/role.enum';
import { CurrentUser } from '../../interfaces/http/decorators/current-user.decorator';
import { Roles } from '../../interfaces/http/decorators/roles.decorator';
import { RolesGuard } from '../../interfaces/http/guards/roles.guard';
import { JwtUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BalanceService } from '../balance/balance.service';
import { TransactionsService } from '../balance/transactions.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { DriversService } from './drivers.service';

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(
    private readonly driversService: DriversService,
    private readonly balanceService: BalanceService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.driversService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateDriverDto) {
    return this.driversService.create(dto);
  }

  @Get('me/balance')
  @Roles(Role.DRIVER)
  balance(@CurrentUser() user: JwtUser) {
    return this.balanceService.getDriverBalance(user);
  }

  @Get('me/transactions')
  @Roles(Role.DRIVER)
  transactions(@CurrentUser() user: JwtUser) {
    return this.transactionsService.findForDriver(user);
  }
}
