import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../interfaces/http/decorators/current-user.decorator';
import { JwtUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UnregisterPushTokenDto } from './dto/unregister-push-token.dto';
import { PushService } from './push.service';

@ApiTags('push')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('register')
  register(@CurrentUser() user: JwtUser, @Body() dto: RegisterPushTokenDto) {
    return this.pushService.register(user.sub, dto);
  }

  @Post('unregister')
  unregister(@CurrentUser() user: JwtUser, @Body() dto: UnregisterPushTokenDto) {
    return this.pushService.unregister(user.sub, dto);
  }
}
