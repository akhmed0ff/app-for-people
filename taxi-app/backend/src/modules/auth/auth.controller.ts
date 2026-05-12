import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser, AuthProfile, DevLoginResponse } from './auth.types';
import { AuthService } from './auth.service';
import { DevLoginDto } from './dto/dev-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('dev-login')
  @ApiOperation({ summary: 'Development-only login for local MVP testing' })
  @ApiBody({ type: DevLoginDto })
  @ApiResponse({ status: 201, description: 'Returns access token and user profile' })
  @ApiResponse({ status: 403, description: 'Disabled in production' })
  devLogin(@Body() dto: DevLoginDto): Promise<DevLoginResponse> {
    return this.authService.devLogin(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Returns current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user with passenger/driver profile' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthProfile> {
    return this.authService.getProfile(user.id);
  }
}
