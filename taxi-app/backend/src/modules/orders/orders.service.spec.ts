import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DriverStatus, OrderStatus, Tariff, UserRole } from '@prisma/client';
import { PricingService } from '../pricing/pricing.service';
import { OrdersService } from './orders.service';

const tariff: Tariff = {
  id: 'tariff_1',
  code: 'ECONOMY',
  name: 'Эконом',
  baseFare: 8000,
  pricePerKm: 2000,
  freeWaitingMinutes: 3,
  waitingPricePerMinute: 500,
  stopPricePerMinute: 500,
  minimumFare: 10000,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const passengerUser = {
  id: 'user_passenger',
  phone: '+998900000002',
  name: 'Passenger',
  role: UserRole.PASSENGER,
  isActive: true,
};

const driverUser = {
  id: 'user_driver',
  phone: '+998900000003',
  name: 'Driver',
  role: UserRole.DRIVER,
  isActive: true,
};

const adminUser = {
  id: 'user_admin',
  phone: '+998900000001',
  name: 'Admin',
  role: UserRole.ADMIN,
  isActive: true,
};

const createOrderDto = {
  tariffCode: 'ECONOMY',
  pickupAddress: 'Точка А',
  pickupLat: 41.311081,
  pickupLng: 69.240562,
  destinationAddress: 'Точка Б',
  destinationLat: 41.299496,
  destinationLng: 69.240073,
  distanceKm: 4.7,
};

function createTestContext(driverStatus: DriverStatus = DriverStatus.ONLINE) {
  const passenger = { id: 'passenger_1', userId: passengerUser.id };
  const driver = { id: 'driver_1', userId: driverUser.id, status: driverStatus };
  const state = {
    orderSeq: 0,
    orders: [] as Array<Record<string, unknown>>,
    driver,
  };

  const prisma: Record<string, any> = {
    $transaction: jest.fn(async (callback: (tx: Record<string, any>) => Promise<unknown>) =>
      callback(prisma),
    ),
    passenger: {
      findUnique: jest.fn(async ({ where }: { where: { userId: string } }) =>
        where.userId === passengerUser.id ? passenger : null,
      ),
    },
    driver: {
      findUnique: jest.fn(async ({ where }: { where: { userId: string } }) =>
        where.userId === driverUser.id ? state.driver : null,
      ),
      update: jest.fn(async ({ data }: { where: { id: string }; data: { status: DriverStatus } }) => {
        state.driver = { ...state.driver, status: data.status };
        return state.driver;
      }),
    },
    order: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.orderSeq += 1;
        const order = {
          id: `order_${state.orderSeq}`,
          driverId: null,
          finalPrice: null,
          waitingMinutes: 0,
          stopMinutes: 0,
          acceptedAt: null,
          arrivedAt: null,
          startedAt: null,
          completedAt: null,
          canceledAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        state.orders.push(order);
        return order;
      }),
      findMany: jest.fn(async ({ where }: { where?: Record<string, unknown> } = {}) =>
        state.orders.filter((order) =>
          Object.entries(where ?? {}).every(([key, value]) => order[key] === value),
        ),
      ),
      findUnique: jest.fn(async ({ where, include }: { where: { id: string }; include?: { tariff: boolean } }) => {
        const order = state.orders.find((item) => item.id === where.id);

        if (!order) {
          return null;
        }

        return include?.tariff ? { ...order, tariff } : order;
      }),
      updateMany: jest.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const order = state.orders.find((item) =>
          Object.entries(where).every(([key, value]) => item[key] === value),
        );

        if (!order) {
          return { count: 0 };
        }

        Object.assign(order, data, { updatedAt: new Date() });

        return { count: 1 };
      }),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const order = state.orders.find((item) => item.id === where.id);

        if (!order) {
          throw new Error('Order not found');
        }

        Object.assign(order, data, { updatedAt: new Date() });

        return order;
      }),
    },
  };

  const tariffsService = {
    findActiveByCode: jest.fn().mockResolvedValue(tariff),
  };
  const pricingService = new PricingService({
    findByCode: jest.fn().mockResolvedValue(tariff),
  } as never);
  const eventEmitter = {
    emit: jest.fn(),
  };
  const service = new OrdersService(prisma as never, tariffsService as never, pricingService, eventEmitter as never);

  return { service, prisma, state, eventEmitter };
}

describe('OrdersService', () => {
  it('creates a SEARCHING order with estimated price', async () => {
    const { service, eventEmitter } = createTestContext();

    const order = await service.create(passengerUser, createOrderDto);

    expect(order).toEqual(
      expect.objectContaining({
        passengerId: 'passenger_1',
        tariffId: tariff.id,
        status: OrderStatus.SEARCHING,
        estimatedPrice: 17400,
      }),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'internal.order.created',
      expect.objectContaining({ order }),
    );
  });

  it('rejects accept when driver is not ONLINE', async () => {
    const { service } = createTestContext(DriverStatus.OFFLINE);
    const order = await service.create(passengerUser, createOrderDto);

    await expect(service.accept(driverUser, order.id)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts available order and marks driver BUSY', async () => {
    const { service, state } = createTestContext();
    const order = await service.create(passengerUser, createOrderDto);

    const accepted = await service.accept(driverUser, order.id);

    expect(accepted).toEqual(
      expect.objectContaining({
        id: order.id,
        driverId: 'driver_1',
        status: OrderStatus.DRIVER_ASSIGNED,
        acceptedAt: expect.any(Date),
      }),
    );
    expect(state.driver.status).toBe(DriverStatus.BUSY);
  });

  it('does not allow accepting an already assigned order', async () => {
    const { service, state } = createTestContext();
    const order = await service.create(passengerUser, createOrderDto);
    await service.accept(driverUser, order.id);
    state.driver.status = DriverStatus.ONLINE;

    await expect(service.accept(driverUser, order.id)).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not allow completing another driver order', async () => {
    const { service, state } = createTestContext();
    const order = await service.create(passengerUser, createOrderDto);
    Object.assign(state.orders[0], {
      driverId: 'another_driver',
      status: OrderStatus.IN_PROGRESS,
    });

    await expect(
      service.complete(driverUser, order.id, {
        distanceKm: 4.9,
        waitingMinutes: 6,
        stopMinutes: 2,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not allow canceling completed order', async () => {
    const { service, state } = createTestContext();
    const order = await service.create(passengerUser, createOrderDto);
    Object.assign(state.orders[0], { status: OrderStatus.COMPLETED });

    await expect(service.cancel(adminUser, order.id, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('runs create -> accept -> arrived -> start -> complete lifecycle', async () => {
    const { service, state } = createTestContext();

    const order = await service.create(passengerUser, createOrderDto);
    await service.accept(driverUser, order.id);
    await service.markArrived(driverUser, order.id);
    await service.start(driverUser, order.id);
    const completed = await service.complete(driverUser, order.id, {
      distanceKm: 4.9,
      waitingMinutes: 6,
      stopMinutes: 2,
    });

    expect(completed).toEqual(
      expect.objectContaining({
        id: order.id,
        status: OrderStatus.COMPLETED,
        finalPrice: 20300,
        waitingMinutes: 6,
        stopMinutes: 2,
        completedAt: expect.any(Date),
      }),
    );
    expect(state.driver.status).toBe(DriverStatus.ONLINE);
  });
});
