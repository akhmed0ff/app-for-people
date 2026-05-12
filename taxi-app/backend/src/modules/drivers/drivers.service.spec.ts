import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DriverStatus, OrderStatus, UserRole } from '@prisma/client';
import { DriversService } from './drivers.service';

const driverUser = {
  id: 'user_driver',
  phone: '+998900000003',
  name: 'Driver',
  role: UserRole.DRIVER,
  isActive: true,
};

const baseDriver = {
  id: 'driver_1',
  userId: driverUser.id,
  carModel: 'Chevrolet Cobalt',
  carNumber: '01 A 777 AA',
  status: DriverStatus.OFFLINE,
  balance: 0,
  rating: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createService(options: { status?: DriverStatus; activeOrder?: boolean } = {}) {
  const state = {
    driver: {
      ...baseDriver,
      status: options.status ?? DriverStatus.OFFLINE,
    },
    location: null as Record<string, unknown> | null,
    activeOrder: options.activeOrder
      ? {
          id: 'order_1',
          driverId: baseDriver.id,
          status: OrderStatus.IN_PROGRESS,
          createdAt: new Date(),
        }
      : null,
    nearbyDrivers: [] as Array<Record<string, any>>,
  };

  const prisma = {
    driver: {
      findUnique: jest.fn(async ({ where }: { where: { id?: string; userId?: string } }) => {
        if (where.userId === driverUser.id || where.id === state.driver.id) {
          return state.driver;
        }

        return null;
      }),
      update: jest.fn(async ({ data }: { where: { id: string }; data: { status: DriverStatus } }) => {
        state.driver = { ...state.driver, ...data };
        return state.driver;
      }),
      findMany: jest.fn(async () => state.nearbyDrivers),
    },
    driverLocation: {
      findUnique: jest.fn(async () => state.location),
      upsert: jest.fn(async ({ update, create }: { update: Record<string, unknown>; create: Record<string, unknown> }) => {
        state.location = {
          id: 'location_1',
          updatedAt: new Date(),
          ...(state.location ? update : create),
        };

        return state.location;
      }),
    },
    order: {
      findFirst: jest.fn(async () => state.activeOrder),
    },
  };

  const eventEmitter = {
    emit: jest.fn(),
  };

  return {
    service: new DriversService(prisma as never, eventEmitter as never),
    prisma,
    state,
    eventEmitter,
  };
}

describe('DriversService', () => {
  it('updates status to ONLINE', async () => {
    const { service } = createService();

    await expect(service.updateStatus(driverUser, { status: DriverStatus.ONLINE })).resolves.toEqual(
      expect.objectContaining({ status: DriverStatus.ONLINE }),
    );
  });

  it('rejects manual BUSY status', async () => {
    const { service } = createService();

    await expect(service.updateStatus(driverUser, { status: DriverStatus.BUSY })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects status change during active order', async () => {
    const { service } = createService({ status: DriverStatus.ONLINE, activeOrder: true });

    await expect(service.updateStatus(driverUser, { status: DriverStatus.OFFLINE })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects blocked driver status changes', async () => {
    const { service } = createService({ status: DriverStatus.BLOCKED });

    await expect(service.updateStatus(driverUser, { status: DriverStatus.ONLINE })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('updates location for ONLINE driver', async () => {
    const { service } = createService({ status: DriverStatus.ONLINE });

    await expect(
      service.updateLocation(driverUser, {
        lat: 41.311081,
        lng: 69.240562,
        heading: 120,
        speed: 45,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        driverId: baseDriver.id,
        lat: 41.311081,
        lng: 69.240562,
        heading: 120,
        speed: 45,
      }),
    );
  });

  it('rejects invalid coordinates', async () => {
    const { service } = createService({ status: DriverStatus.ONLINE });

    await expect(
      service.updateLocation(driverUser, {
        lat: 91,
        lng: 69.240562,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sorts nearby drivers by distance and limits sensitive data', async () => {
    const { service, state } = createService();
    state.nearbyDrivers = [
      {
        ...baseDriver,
        id: 'driver_far',
        status: DriverStatus.ONLINE,
        location: {
          id: 'loc_far',
          driverId: 'driver_far',
          lat: 41.35,
          lng: 69.3,
          heading: null,
          speed: null,
          updatedAt: new Date(),
        },
        user: { phone: '+998secret' },
      },
      {
        ...baseDriver,
        id: 'driver_near',
        status: DriverStatus.ONLINE,
        location: {
          id: 'loc_near',
          driverId: 'driver_near',
          lat: 41.312,
          lng: 69.241,
          heading: null,
          speed: null,
          updatedAt: new Date(),
        },
        user: { phone: '+998secret2' },
      },
    ];

    const result = await service.findNearby({
      lat: 41.311081,
      lng: 69.240562,
      radiusKm: 10,
    });

    expect(result.map((driver) => driver.driverId)).toEqual(['driver_near', 'driver_far']);
    expect(result[0]).not.toHaveProperty('user');
    expect(result[0].distanceKm).toBeLessThan(result[1].distanceKm);
  });
});
