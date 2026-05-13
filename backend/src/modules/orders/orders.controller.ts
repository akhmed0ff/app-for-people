import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../../domain/auth/role.enum';
import { CurrentUser } from '../../interfaces/http/decorators/current-user.decorator';
import { Roles } from '../../interfaces/http/decorators/roles.decorator';
import { RolesGuard } from '../../interfaces/http/guards/roles.guard';
import { JwtUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DRIVER, Role.PASSENGER)
  findAll(@CurrentUser() user: JwtUser) {
    return this.ordersService.findForUser(user);
  }

  @Get('available')
  @Roles(Role.DRIVER)
  available(@CurrentUser() user: JwtUser) {
    return this.ordersService.availableOffers(user);
  }

  @Get('offers/current')
  @Roles(Role.DRIVER)
  currentOffer(@CurrentUser() user: JwtUser) {
    return this.ordersService.currentOffer(user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PASSENGER)
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user, dto);
  }

  @Patch(':id/assign-driver')
  @Roles(Role.ADMIN, Role.DRIVER)
  assignDriver(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: AssignDriverDto) {
    return this.ordersService.assignDriver(user, id, dto);
  }

  @Post('offers/:offerId/accept')
  @Roles(Role.DRIVER)
  acceptOffer(@CurrentUser() user: JwtUser, @Param('offerId') offerId: string) {
    return this.ordersService.acceptOffer(user, offerId);
  }

  @Post('offers/:offerId/reject')
  @Roles(Role.DRIVER)
  rejectOffer(@CurrentUser() user: JwtUser, @Param('offerId') offerId: string) {
    return this.ordersService.rejectOffer(user, offerId);
  }

  @Post(':id/accept')
  @Roles(Role.DRIVER)
  acceptOrder(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.ordersService.acceptOrder(user, id);
  }

  @Patch(':id/complete')
  @Roles(Role.ADMIN, Role.DRIVER)
  complete(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.ordersService.complete(user, id);
  }
}
