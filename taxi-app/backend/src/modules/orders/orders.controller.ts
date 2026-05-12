import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PASSENGER)
  @ApiOperation({ summary: 'Creates a passenger order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user, dto);
  }

  @Get('orders/available')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Returns orders available for drivers' })
  findAvailable() {
    return this.ordersService.findAvailable();
  }

  @Post('orders/:id/accept')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Accepts an available order' })
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.accept(user, id);
  }

  @Post('orders/:id/arrived')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Marks driver as arrived' })
  arrived(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.markArrived(user, id);
  }

  @Post('orders/:id/start')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Starts trip' })
  start(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.start(user, id);
  }

  @Post('orders/:id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Completes trip and calculates final price' })
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.complete(user, id, dto);
  }

  @Post('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancels order by passenger, assigned driver, or admin' })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancel(user, id, dto);
  }

  @Get('orders/my')
  @ApiOperation({ summary: 'Returns passenger or driver order history' })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findMine(user);
  }

  @Get('admin/orders')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Returns all orders for admin with optional status filter' })
  findAdmin(@Query() query: AdminOrdersQueryDto) {
    return this.ordersService.findAdmin(query);
  }
}
