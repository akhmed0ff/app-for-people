import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DriverStatus, OrderOfferStatus, OrderStatus, UserStatus } from '@prisma/client';
import { Role } from '../../domain/auth/role.enum';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { PushService } from '../push/push.service';
import { MatchingService } from './matching.service';

const baseOrder = {
  id: 'order-1',
  passengerId: 'passenger-1',
  driverId: null,
  tariffId: 'tariff-1',
  status: OrderStatus.SEARCHING,
  pickupAddress: 'Pickup',
  pickupLat: 41.311081,
  pickupLng: 69.240562,
  dropoffAddress: 'Destination',
  dropoffLat: 41.299496,
  dropoffLng: 69.240073,
  distanceMeters: 5000,
  durationSeconds: null,
  fareCents: 17400,
  currency: 'UZS',
  paymentMethod: 'CASH',
  requestedAt: new Date(),
  assignedAt: null,
  acceptedAt: null,
  arrivedAt: null,
  startedAt: null,
  completedAt: null,
  canceledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  passenger: { id: 'passenger-1', userId: 'passenger-user-1' },
  tariff: { code: 'ECONOMY' },
};

const driverUser = { sub: 'driver-user-1', email: 'driver@test.dev', role: Role.DRIVER };

describe('MatchingService candidates', () => {
  const prisma = {
    driver: { findMany: jest.fn(), findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
    orderOffer: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const push = { notifyDrivers: jest.fn(), notifyPassenger: jest.fn() };
  const pricing = { calculateTrip: jest.fn().mockReturnValue({ total: 17400 }) };
  let service: MatchingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: PrismaService, useValue: prisma },
        { provide: PushService, useValue: push },
        { provide: PricingService, useValue: pricing },
      ],
    }).compile();

    service = moduleRef.get(MatchingService);
  });

  it('finds nearest online driver', async () => {
    prisma.driver.findMany.mockResolvedValue([
      makeDriver('far', 41.33, 69.24),
      makeDriver('near', 41.312, 69.2406),
    ]);

    await expect(service.findNearestCandidate(baseOrder as never)).resolves.toEqual(
      expect.objectContaining({ driverId: 'near' }),
    );
  });

  it.each([
    ['offline driver', makeDriver('offline', 41.312, 69.2406, { status: DriverStatus.OFFLINE })],
    ['busy driver', makeDriver('busy', 41.312, 69.2406, { status: DriverStatus.BUSY })],
    ['blocked driver', makeDriver('blocked', 41.312, 69.2406, { userStatus: UserStatus.SUSPENDED })],
    ['driver without location', makeDriver('no-location', 41.312, 69.2406, { withoutLocation: true })],
    ['driver outside radius', makeDriver('outside', 42.1, 69.2406)],
    ['driver who already received offer', makeDriver('already-offered', 41.312, 69.2406, { receivedOffer: true })],
    ['driver with another pending offer', makeDriver('pending', 41.312, 69.2406, { pendingOffer: true })],
    ['driver with active order', makeDriver('active-order', 41.312, 69.2406, { activeOrder: true })],
  ])('ignores %s', async (_name, driver) => {
    prisma.driver.findMany.mockResolvedValue([driver]);

    await expect(service.findNearestCandidate(baseOrder as never)).resolves.toBeNull();
  });

  it('creates pending offer on start matching', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.driver.findMany.mockResolvedValue([makeDriver('driver-1', 41.312, 69.2406)]);
    prisma.orderOffer.create.mockResolvedValue({
      id: 'offer-1',
      orderId: 'order-1',
      driverId: 'driver-1',
      status: OrderOfferStatus.PENDING,
      expiresAt: new Date(Date.now() + 20000),
    });

    await service.startMatching('order-1');

    expect(prisma.orderOffer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        driverId: 'driver-1',
        expiresAt: expect.any(Date),
      }),
    });
  });

  it('accept offer assigns order and makes driver busy', async () => {
    const tx = makeAcceptTx();
    prisma.driver.findUnique.mockResolvedValue({ id: 'driver-1' });
    prisma.$transaction.mockImplementation((callback) => callback(tx));

    await service.acceptOffer(driverUser, 'offer-1');

    expect(tx.orderOffer.update).toHaveBeenCalledWith({
      where: { id: 'offer-1' },
      data: { status: OrderOfferStatus.ACCEPTED, respondedAt: expect.any(Date) },
    });
    expect(tx.driver.update).toHaveBeenCalledWith({
      where: { id: 'driver-1' },
      data: { status: DriverStatus.BUSY },
    });
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: expect.objectContaining({
        driverId: 'driver-1',
        status: OrderStatus.DRIVER_ASSIGNED,
        assignedAt: expect.any(Date),
        acceptedAt: expect.any(Date),
      }),
      include: expect.any(Object),
    });
  });

  it('accept expired offer fails', async () => {
    const tx = makeAcceptTx({ expiresAt: new Date(Date.now() - 1000) });
    prisma.driver.findUnique.mockResolvedValue({ id: 'driver-1' });
    prisma.$transaction.mockImplementation((callback) => callback(tx));

    await expect(service.acceptOffer(driverUser, 'offer-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('reject offer triggers next candidate', async () => {
    const continueSpy = jest.spyOn(service, 'continueMatching').mockResolvedValue(null);
    prisma.driver.findUnique.mockResolvedValue({ id: 'driver-1' });
    prisma.orderOffer.findUnique.mockResolvedValue({
      id: 'offer-1',
      orderId: 'order-1',
      driverId: 'driver-1',
      status: OrderOfferStatus.PENDING,
    });
    prisma.orderOffer.update.mockResolvedValue({ id: 'offer-1', status: OrderOfferStatus.REJECTED });

    await service.rejectOffer(driverUser, 'offer-1');

    expect(continueSpy).toHaveBeenCalledWith('order-1');
  });

  it('cancel order cancels pending offers', async () => {
    prisma.orderOffer.findMany.mockResolvedValue([{ id: 'offer-1', driverId: 'driver-1' }]);
    prisma.orderOffer.updateMany.mockResolvedValue({ count: 1 });

    await service.cancelOffers('order-1');

    expect(prisma.orderOffer.updateMany).toHaveBeenCalledWith({
      where: { orderId: 'order-1', status: OrderOfferStatus.PENDING },
      data: { status: OrderOfferStatus.CANCELED, respondedAt: expect.any(Date) },
    });
  });

  it('returns no candidate when no drivers are available', async () => {
    prisma.driver.findMany.mockResolvedValue([]);

    await expect(service.findNearestCandidate(baseOrder as never)).resolves.toBeNull();
  });

  it('integration scenario: driver1 rejects, driver2 accepts', async () => {
    const continueSpy = jest.spyOn(service, 'continueMatching').mockResolvedValue(null);
    prisma.driver.findUnique.mockResolvedValueOnce({ id: 'driver-1' });
    prisma.orderOffer.findUnique.mockResolvedValueOnce({
      id: 'offer-1',
      orderId: 'order-1',
      driverId: 'driver-1',
      status: OrderOfferStatus.PENDING,
    });
    prisma.orderOffer.update.mockResolvedValueOnce({ id: 'offer-1', status: OrderOfferStatus.REJECTED });

    await service.rejectOffer(driverUser, 'offer-1');

    const tx = makeAcceptTx({ driverId: 'driver-2', offerId: 'offer-2' });
    prisma.driver.findUnique.mockResolvedValueOnce({ id: 'driver-2' });
    prisma.$transaction.mockImplementation((callback) => callback(tx));

    await service.acceptOffer({ ...driverUser, sub: 'driver-user-2' }, 'offer-2');

    expect(continueSpy).toHaveBeenCalledWith('order-1');
    expect(tx.driver.update).toHaveBeenCalledWith({
      where: { id: 'driver-2' },
      data: { status: DriverStatus.BUSY },
    });
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: expect.objectContaining({ driverId: 'driver-2', status: OrderStatus.DRIVER_ASSIGNED }),
      include: expect.any(Object),
    });
  });
});

function makeDriver(
  id: string,
  latitude: number,
  longitude: number,
  options: {
    status?: DriverStatus;
    userStatus?: UserStatus;
    withoutLocation?: boolean;
    receivedOffer?: boolean;
    pendingOffer?: boolean;
    activeOrder?: boolean;
  } = {},
) {
  return {
    id,
    status: options.status ?? DriverStatus.ONLINE,
    user: { status: options.userStatus ?? UserStatus.ACTIVE },
    locations: options.withoutLocation ? [] : [{ latitude, longitude }],
    offers: options.pendingOffer || options.receivedOffer ? [{ id: 'offer-existing' }] : [],
    orders: options.activeOrder ? [{ id: 'active-order' }] : [],
  };
}

function makeAcceptTx(
  options: { expiresAt?: Date; driverId?: string; offerId?: string } = {},
) {
  const driverId = options.driverId ?? 'driver-1';
  const offerId = options.offerId ?? 'offer-1';
  return {
    orderOffer: {
      findUnique: jest.fn().mockResolvedValue({
        id: offerId,
        orderId: 'order-1',
        driverId,
        status: OrderOfferStatus.PENDING,
        expiresAt: options.expiresAt ?? new Date(Date.now() + 20000),
        order: { id: 'order-1', status: OrderStatus.SEARCHING, driverId: null },
        driver: { id: driverId, status: DriverStatus.ONLINE },
      }),
      update: jest.fn().mockResolvedValue({ id: offerId }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    driver: {
      update: jest.fn().mockResolvedValue({ id: driverId, status: DriverStatus.BUSY }),
    },
    orderHistory: {
      create: jest.fn().mockResolvedValue({ id: 'history-1' }),
    },
    order: {
      update: jest.fn().mockResolvedValue({
        ...baseOrder,
        id: 'order-1',
        driverId,
        status: OrderStatus.DRIVER_ASSIGNED,
      }),
    },
  };
}
