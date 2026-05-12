import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EstimatePriceDto } from './dto/estimate-price.dto';
import { PricingService } from './pricing.service';
import { PriceEstimate } from './pricing.types';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('estimate')
  @ApiOperation({ summary: 'Estimates trip price by tariff and route data' })
  @ApiResponse({ status: 201, description: 'Price estimate' })
  @ApiResponse({ status: 422, description: 'Tariff is inactive' })
  estimate(@Body() dto: EstimatePriceDto): Promise<PriceEstimate> {
    return this.pricingService.estimate(dto);
  }
}
