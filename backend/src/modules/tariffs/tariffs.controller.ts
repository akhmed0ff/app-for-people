import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

  @Get()
  @Roles(Role.ADMIN, Role.DRIVER, Role.PASSENGER)
  findAll() {
    return this.tariffsService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateTariffDto) {
    return this.tariffsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateTariffDto) {
    return this.tariffsService.update(id, dto);
  }
}
