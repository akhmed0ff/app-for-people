import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';

const baseUser = {
  id: 'user_1',
  phone: '+998901112233',
  name: 'Driver',
  role: UserRole.DRIVER,
  isActive: true,
};

describe('AuthService', () => {
  const createService = (nodeEnv = 'development') => {
    const prisma = {
      user: {
        upsert: jest.fn().mockResolvedValue(baseUser),
        findUniqueOrThrow: jest.fn().mockResolvedValue(baseUser),
      },
      passenger: {
        upsert: jest.fn().mockResolvedValue({ id: 'passenger_1', userId: baseUser.id }),
        findUnique: jest.fn().mockResolvedValue(null),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      driver: {
        upsert: jest.fn().mockResolvedValue({ id: 'driver_1', userId: baseUser.id }),
        findUnique: jest.fn().mockResolvedValue({ id: 'driver_1', userId: baseUser.id }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    };
    const configService = {
      get: jest.fn().mockReturnValue(nodeEnv),
    };

    const service = new AuthService(prisma as never, jwtService as never, configService as never);

    return { service, prisma, jwtService, configService };
  };

  it('rejects dev-login in production', async () => {
    const { service } = createService('production');

    await expect(
      service.devLogin({ phone: '+998901112233', role: UserRole.DRIVER }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates passenger profile for passenger dev-login', async () => {
    const { service, prisma } = createService();

    await service.devLogin({ phone: '+998901112233', role: UserRole.PASSENGER });

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { phone: '+998901112233' },
        create: expect.objectContaining({ role: UserRole.PASSENGER }),
      }),
    );
    expect(prisma.driver.deleteMany).toHaveBeenCalledWith({ where: { userId: baseUser.id } });
    expect(prisma.passenger.upsert).toHaveBeenCalledWith({
      where: { userId: baseUser.id },
      update: {},
      create: { userId: baseUser.id },
    });
  });

  it('creates driver profile and signs JWT for driver dev-login', async () => {
    const { service, prisma, jwtService } = createService();

    const result = await service.devLogin({ phone: '+998901112233', role: UserRole.DRIVER });

    expect(prisma.passenger.deleteMany).toHaveBeenCalledWith({ where: { userId: baseUser.id } });
    expect(prisma.driver.upsert).toHaveBeenCalledWith({
      where: { userId: baseUser.id },
      update: {},
      create: expect.objectContaining({ userId: baseUser.id }),
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: baseUser.id,
      phone: baseUser.phone,
      role: baseUser.role,
    });
    expect(result.accessToken).toBe('signed-token');
    expect(result.developmentOnly).toBe(true);
  });
});
