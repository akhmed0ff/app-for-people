import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../../domain/auth/role.enum';
import { Roles } from '../../interfaces/http/decorators/roles.decorator';
import { RolesGuard } from '../../interfaces/http/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RouteEstimateDto } from './dto/route-estimate.dto';
import { RoutingService } from './routing.service';

@ApiTags('routing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routing')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post('estimate')
  @Roles(Role.ADMIN, Role.PASSENGER)
  estimate(@Body() dto: RouteEstimateDto) {
    return this.routingService.estimate(dto);
  }
}
