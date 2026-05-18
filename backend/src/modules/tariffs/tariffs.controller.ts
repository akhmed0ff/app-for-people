import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../domain/auth/role.enum';
import { Roles } from '../../interfaces/http/decorators/roles.decorator';
import { RolesGuard } from '../../interfaces/http/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';
import { TariffsService } from './tariffs.service';

@ApiTags('tariffs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tariffs')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  /**
   * Public endpoint for drivers and passengers.
   * Returns ONLY active tariffs — inactive ones are invisible to clients.
   */
  @Get()
  @ApiOperation({ summary: 'List active tariffs (drivers & passengers)' })
  @Roles(Role.DRIVER, Role.PASSENGER)
  findActive() {
    return this.tariffsService.findActive();
  }

  /**
   * Admin endpoint — returns all tariffs including inactive ones,
   * so the admin panel can display and manage the full catalogue.
   */
  @Get('all')
  @ApiOperation({ summary: 'List all tariffs including inactive (admin only)' })
  @Roles(Role.ADMIN)
  findAll() {
    return this.tariffsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tariff (admin only)' })
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateTariffDto) {
    return this.tariffsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tariff (admin only)' })
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateTariffDto) {
    return this.tariffsService.update(id, dto);
  }
}
