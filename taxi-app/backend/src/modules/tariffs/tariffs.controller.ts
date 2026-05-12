import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';
import { TariffsService } from './tariffs.service';

@ApiTags('Tariffs')
@Controller()
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Get('tariffs')
  @ApiOperation({ summary: 'Returns active tariffs' })
  @ApiResponse({ status: 200, description: 'Active tariffs' })
  findActive() {
    return this.tariffsService.findActive();
  }

  @Get('tariffs/:code')
  @ApiOperation({ summary: 'Returns active tariff by code' })
  @ApiResponse({ status: 200, description: 'Active tariff' })
  @ApiResponse({ status: 404, description: 'Tariff not found or inactive' })
  findActiveByCode(@Param('code') code: string) {
    return this.tariffsService.findActiveByCode(code);
  }

  @Post('admin/tariffs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creates a tariff' })
  @ApiResponse({ status: 201, description: 'Tariff created' })
  create(@Body() dto: CreateTariffDto) {
    return this.tariffsService.create(dto);
  }

  @Patch('admin/tariffs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Updates a tariff' })
  @ApiResponse({ status: 200, description: 'Tariff updated' })
  update(@Param('id') id: string, @Body() dto: UpdateTariffDto) {
    return this.tariffsService.update(id, dto);
  }

  @Patch('admin/tariffs/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggles tariff active state' })
  @ApiResponse({ status: 200, description: 'Tariff toggled' })
  toggle(@Param('id') id: string) {
    return this.tariffsService.toggle(id);
  }
}
