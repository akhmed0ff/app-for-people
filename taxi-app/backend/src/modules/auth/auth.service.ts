import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DriverStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DevLoginDto } from './dto/dev-login.dto';
import { AuthenticatedUser, AuthProfile, DevLoginResponse, JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async devLogin(dto: DevLoginDto): Promise<DevLoginResponse> {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Dev login is not available in production');
    }

    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      update: {
        role: dto.role,
        isActive: true,
      },
      create: {
        phone: dto.phone,
        name: this.getDefaultName(dto.role),
        role: dto.role,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (dto.role === UserRole.PASSENGER) {
      await this.prisma.driver.deleteMany({
        where: { userId: user.id },
      });
      await this.prisma.passenger.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
        },
      });
    }

    if (dto.role === UserRole.DRIVER) {
      await this.prisma.passenger.deleteMany({
        where: { userId: user.id },
      });
      await this.prisma.driver.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          carModel: 'Demo car',
          carNumber: 'DEV-000',
          status: DriverStatus.OFFLINE,
        },
      });
    }

    if (dto.role === UserRole.ADMIN) {
      await Promise.all([
        this.prisma.passenger.deleteMany({
          where: { userId: user.id },
        }),
        this.prisma.driver.deleteMany({
          where: { userId: user.id },
        }),
      ]);
    }

    const profile = await this.getProfile(user.id);

    return {
      accessToken: await this.signAccessToken(user),
      ...profile,
      developmentOnly: true,
    };
  }

  async getProfile(userId: string): Promise<AuthProfile> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    const [passenger, driver] = await Promise.all([
      this.prisma.passenger.findUnique({
        where: { userId },
      }),
      this.prisma.driver.findUnique({
        where: { userId },
      }),
    ]);

    return {
      user,
      passenger,
      driver,
    };
  }

  private async signAccessToken(user: AuthenticatedUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }

  private getDefaultName(role: UserRole): string {
    if (role === UserRole.ADMIN) {
      return 'Admin';
    }

    if (role === UserRole.DRIVER) {
      return 'Driver';
    }

    return 'Passenger';
  }
}
