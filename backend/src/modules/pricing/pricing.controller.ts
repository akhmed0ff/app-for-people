import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../../domain/auth/role.enum';
import { Roles } from '../../interfaces/http/decorators/roles.decorator';
import { RolesGuard } from '../../interfaces/http/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EstimatePriceDto } from './dto/estimate-price.dto';
import { PricingService } from './pricing.service';

@ApiTags('pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('estimate')
  @Roles(Role.ADMIN, Role.PASSENGER)
  estimate(@Body() dto: EstimatePriceDto) {
    return this.pricingService.estimate(dto);
  }
}
