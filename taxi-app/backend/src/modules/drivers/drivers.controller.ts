import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminDriversQueryDto } from './dto/admin-drivers-query.dto';
import { NearbyDriversQueryDto } from './dto/nearby-drivers-query.dto';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { DriversService } from './drivers.service';

@ApiTags('Drivers')
@Controller()
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get('drivers/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Returns current driver profile, location, and active order' })
  @ApiResponse({ status: 200, description: 'Driver profile' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.driversService.getMe(user);
  }

  @Patch('drivers/me/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Updates current driver status to ONLINE or OFFLINE' })
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateDriverStatusDto) {
    return this.driversService.updateStatus(user, dto);
  }

  @Patch('drivers/me/location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Updates current driver location' })
  updateLocation(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateDriverLocationDto) {
    return this.driversService.updateLocation(user, dto);
  }

  @Get('drivers/nearby')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Returns nearby online drivers for internal/admin testing' })
  findNearby(@Query() query: NearbyDriversQueryDto) {
    return this.driversService.findNearby(query);
  }

  @Get('admin/drivers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Returns drivers for admin with optional status filter' })
  findAdmin(@Query() query: AdminDriversQueryDto) {
    return this.driversService.findAdmin(query);
  }

  @Patch('admin/drivers/:id/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Blocks a driver' })
  block(@Param('id') id: string) {
    return this.driversService.block(id);
  }

  @Patch('admin/drivers/:id/unblock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unblocks a driver and sets OFFLINE status' })
  unblock(@Param('id') id: string) {
    return this.driversService.unblock(id);
  }
}
