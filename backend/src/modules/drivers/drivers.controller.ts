import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../../domain/auth/role.enum';
import { Roles } from '../../interfaces/http/decorators/roles.decorator';
import { RolesGuard } from '../../interfaces/http/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDriverDto } from './dto/create-driver.dto';
import { DriversService } from './drivers.service';

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.driversService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateDriverDto) {
    return this.driversService.create(dto);
  }
}
