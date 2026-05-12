import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { Role } from '../../domain/auth/role.enum';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { DevLoginDto } from './dto/dev-login.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtUser, TokenPair } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens({ sub: user.id, email: user.email, role: user.role as Role });
  }

  async devLogin(dto: DevLoginDto): Promise<TokenPair> {
    if (!this.config.get<boolean>('DEV_LOGIN_ENABLED')) {
      throw new ForbiddenException('Dev login is disabled');
    }

    const emailByRole = {
      [Role.ADMIN]: 'admin@taxi.local',
      [Role.DRIVER]: 'driver@taxi.local',
      [Role.PASSENGER]: 'passenger@taxi.local',
    };
    const user = await this.prisma.user.findUnique({
      where: { email: emailByRole[dto.role] },
    });
    if (!user) {
      throw new UnauthorizedException('Seed user for dev login was not found');
    }

    return this.issueTokens({ sub: user.id, email: user.email, role: user.role as Role });
  }

  async refresh(dto: RefreshTokenDto): Promise<TokenPair> {
    const tokenHash = await this.hash(dto.refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens({
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role as Role,
    });
  }

  async logout(dto: RefreshTokenDto) {
    const tokenHash = await this.hash(dto.refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private async issueTokens(user: JwtUser): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(user, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
    });
    const refreshToken = await this.jwt.signAsync(user, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.sub,
        tokenHash: await this.hash(refreshToken),
        expiresAt: this.refreshExpiresAt(),
      },
    });

    return { accessToken, refreshToken };
  }

  private refreshExpiresAt() {
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() +
        this.parseDurationSeconds(this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN')),
    );
    return expiresAt;
  }

  private parseDurationSeconds(value: string) {
    const match = /^(\d+)([smhd])?$/.exec(value.trim());
    if (!match) {
      return 30 * 24 * 60 * 60;
    }

    const amount = Number(match[1]);
    const unit = (match[2] ?? 's') as 's' | 'm' | 'h' | 'd';
    const multipliers: Record<typeof unit, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };
    const multiplier = multipliers[unit];

    return amount * multiplier;
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
