import { Test } from '@nestjs/testing';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ExpoPushService } from './expo-push.service';
import { PushService } from './push.service';

describe('PushService', () => {
  const prisma = {
    pushToken: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    passenger: {
      findUnique: jest.fn(),
    },
    driver: {
      findUnique: jest.fn(),
    },
  };
  const expoPush = {
    send: jest.fn(),
  };

  let service: PushService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PushService,
        { provide: PrismaService, useValue: prisma },
        { provide: ExpoPushService, useValue: expoPush },
      ],
    }).compile();

    service = moduleRef.get(PushService);
  });

  it('registers a push token with upsert', async () => {
    prisma.pushToken.upsert.mockResolvedValue({ id: 'token-id' });

    await expect(
      service.register('user-1', {
        token: 'ExponentPushToken[token]',
        platform: 'ios',
        deviceId: 'device-1',
      }),
    ).resolves.toEqual({ id: 'token-id' });

    expect(prisma.pushToken.upsert).toHaveBeenCalledWith({
      where: { token: 'ExponentPushToken[token]' },
      create: {
        userId: 'user-1',
        token: 'ExponentPushToken[token]',
        platform: 'ios',
        deviceId: 'device-1',
      },
      update: {
        userId: 'user-1',
        platform: 'ios',
        deviceId: 'device-1',
        isActive: true,
      },
    });
  });

  it('deactivates invalid tokens returned by Expo', async () => {
    prisma.pushToken.findMany.mockResolvedValue([{ token: 'ExponentPushToken[bad]' }]);
    expoPush.send.mockResolvedValue({
      invalidTokens: ['ExponentPushToken[bad]'],
      failed: [{ token: 'ExponentPushToken[bad]', message: 'DeviceNotRegistered' }],
    });

    await service.notifyUser('user-1', {
      type: 'ORDER_ACCEPTED',
      orderId: 'order-1',
      role: 'PASSENGER',
    });

    expect(prisma.pushToken.updateMany).toHaveBeenCalledWith({
      where: { token: { in: ['ExponentPushToken[bad]'] } },
      data: { isActive: false },
    });
  });
});
