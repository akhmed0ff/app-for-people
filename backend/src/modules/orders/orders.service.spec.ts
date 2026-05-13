import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';
import { Role } from '../../domain/auth/role.enum';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BalanceService } from '../balance/balance.service';
import { MatchingService } from '../matching/matching.service';
import { PricingService } from '../pricing/pricing.service';
import { RoutingService } from '../routing/routing.service';
import { OrdersService } from './orders.service';

describe('OrdersService routing integration', () => {
  const prisma = {
    passenger: { findUniqueOrThrow: jest.fn() },
    tariff: { findUnique: jest.fn() },
    order: { create: jest.fn() },
  };
  const matching = { startMatching: jest.fn() };
  const routing = { estimate: jest.fn() };
  const pricing = { estimate: jest.fn() };
  const config = { get: jest.fn() };
  let service: OrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: BalanceService, useValue: {} },
        { provide: MatchingService, useValue: matching },
        { provide: RoutingService, useValue: routing },
        { provide: PricingService, useValue: pricing },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
    prisma.passenger.findUniqueOrThrow.mockResolvedValue({ id: 'passenger-1' });
    prisma.tariff.findUnique.mockResolvedValue({ id: 'tariff-1', code: 'ECONOMY' });
    routing.estimate.mockResolvedValue({
      distanceMeters: 4701,
      distanceKm: 4.7,
      durationSeconds: 691,
      durationMinutes: 12,
      geometry: 'polyline',
      tariffCode: 'ECONOMY',
      estimatedPrice: 17400,
      pricingBreakdown: {
        baseFare: 8000,
        distancePrice: 9400,
        waitingPrice: 0,
        stopPrice: 0,
        minimumFare: 10000,
        totalPrice: 17400,
      },
    });
    prisma.order.create.mockResolvedValue({ id: 'order-1', status: OrderStatus.SEARCHING });
  });

  it('creates order without distanceKm and starts matching', async () => {
    await service.create(
      { sub: 'passenger-user-1', email: 'passenger@test.dev', role: Role.PASSENGER },
      {
        tariffCode: 'ECONOMY',
        pickupAddress: '5-й микрорайон, Ангрен',
        pickupLat: 41.0198,
        pickupLng: 70.1284,
        destinationAddress: 'Базар Ангрен',
        destinationLat: 41.0125,
        destinationLng: 70.1393,
      },
    );

    expect(routing.estimate).toHaveBeenCalledWith({
      pickupLat: 41.0198,
      pickupLng: 70.1284,
      destinationLat: 41.0125,
      destinationLng: 70.1393,
      tariffCode: 'ECONOMY',
    });
    expect(prisma.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        passengerId: 'passenger-1',
        tariffId: 'tariff-1',
        distanceMeters: 4701,
        durationSeconds: 691,
        routeDurationMinutes: 12,
        routeGeometry: 'polyline',
        fareCents: 17400,
      }),
      include: expect.any(Object),
    });
    expect(matching.startMatching).toHaveBeenCalledWith('order-1');
  });
});
