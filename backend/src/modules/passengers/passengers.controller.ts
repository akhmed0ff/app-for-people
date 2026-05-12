import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../../domain/auth/role.enum';
import { CurrentUser } from '../../interfaces/http/decorators/current-user.decorator';
import { Roles } from '../../interfaces/http/decorators/roles.decorator';
import { RolesGuard } from '../../interfaces/http/guards/roles.guard';
import { JwtUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePassengerDto } from './dto/create-passenger.dto';
import { PassengersService } from './passengers.service';

@ApiTags('passengers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('passengers')
export class PassengersController {
  constructor(private readonly passengersService: PassengersService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.passengersService.findAll();
  }

  @Get('me')
  @Roles(Role.PASSENGER)
  me(@CurrentUser() user: JwtUser) {
    return this.passengersService.findByUserId(user.sub);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreatePassengerDto) {
    return this.passengersService.create(dto);
  }
}
