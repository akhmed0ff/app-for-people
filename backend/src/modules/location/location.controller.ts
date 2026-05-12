import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../../domain/auth/role.enum';
import { Roles } from '../../interfaces/http/decorators/roles.decorator';
import { RolesGuard } from '../../interfaces/http/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { LocationService } from './location.service';

@ApiTags('location')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('drivers/latest')
  @Roles(Role.ADMIN, Role.PASSENGER)
  latestDriverLocations() {
    return this.locationService.latestDriverLocations();
  }

  @Post('drivers')
  @Roles(Role.ADMIN, Role.DRIVER)
  updateDriverLocation(@Body() dto: UpdateDriverLocationDto) {
    return this.locationService.updateDriverLocation(dto);
  }
}
