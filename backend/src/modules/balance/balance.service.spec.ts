import { Test } from '@nestjs/testing';
import { OrderStatus, TransactionStatus, TransactionType } from '@prisma/client';
import { Role } from '../../domain/auth/role.enum';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { BalanceService } from './balance.service';
import { TransactionsService } from './transactions.service';

describe('BalanceService', () => {
  const prisma = {
    $transaction: jest.fn(),
    transaction: {
      findMany: jest.fn(),
    },
    driver: {
      findUnique: jest.fn(),
    },
  };
  const pricing = {
    calculateTrip: jest.fn(),
  };
  let service: BalanceService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        BalanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: PricingService, useValue: pricing },
      ],
    }).compile();

    service = moduleRef.get(BalanceService);
  });

  it('top-up increases balance and creates transaction', async () => {
    const tx = {
      driver: { update: jest.fn().mockResolvedValue({ id: 'driver-1', balance: 100000 }) },
      transaction: { create: jest.fn().mockResolvedValue({ id: 'tx-1' }) },
    };
    prisma.$transaction.mockImplementation((callback) => callback(tx));

    await service.topUp('driver-1', { amount: 100000, description: 'Manual top-up' });

    expect(tx.driver.update).toHaveBeenCalledWith({
      where: { id: 'driver-1' },
      data: { balance: { increment: 100000 } },
      include: { user: true },
    });
    expect(tx.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 100000,
        amountCents: 100000,
        type: TransactionType.TOP_UP,
        status: TransactionStatus.SUCCESS,
      }),
    });
  });

  it('adjustment changes balance by signed amount', async () => {
    const tx = {
      driver: { update: jest.fn().mockResolvedValue({ id: 'driver-1', balance: -20000 }) },
      transaction: { create: jest.fn().mockResolvedValue({ id: 'tx-1' }) },
    };
    prisma.$transaction.mockImplementation((callback) => callback(tx));

    await service.adjust('driver-1', { amount: -20000, description: 'Correction' });

    expect(tx.driver.update).toHaveBeenCalledWith({
      where: { id: 'driver-1' },
      data: { balance: { increment: -20000 } },
      include: { user: true },
    });
    expect(tx.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: -20000,
        type: TransactionType.ADJUSTMENT,
      }),
    });
  });

  it('complete order deducts platform commission once', async () => {
    const tx = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          driverId: 'driver-1',
          driver: { id: 'driver-1', commissionRatePercent: 10 },
          tariff: { code: 'economy', carSupplyPrice: 5000, pricePerKm: 3000, freeWaitingMinutes: 3, waitingPricePerMinute: 500, stopPrice: 0, minimumOrderPrice: 10000, currency: 'UZS' },
          status: OrderStatus.IN_PROGRESS,
          fareCents: null,
          distanceMeters: 15000,
          currency: 'UZS',
        }),
        update: jest.fn().mockResolvedValue({ id: 'order-1', status: OrderStatus.COMPLETED }),
      },
      driver: { update: jest.fn().mockResolvedValue({ id: 'driver-1', balance: -5000 }) },
      transaction: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
      },
    };
    prisma.$transaction.mockImplementation((callback) => callback(tx));
    pricing.calculateTrip.mockReturnValue({ total: 50000 });

    await service.completeOrderWithCommission('order-1');

    expect(tx.driver.update).toHaveBeenCalledWith({
      where: { id: 'driver-1' },
      data: { balance: { decrement: 5000 } },
    });
    expect(tx.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: -5000,
        type: TransactionType.TRIP_COMMISSION,
      }),
    });
  });
});

describe('TransactionsService', () => {
  const prisma = {
    driver: { findUnique: jest.fn() },
    transaction: { findMany: jest.fn() },
  };
  let service: TransactionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [TransactionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(TransactionsService);
  });

  it('driver sees only own transactions', async () => {
    prisma.driver.findUnique.mockResolvedValue({ id: 'driver-1' });
    prisma.transaction.findMany.mockResolvedValue([{ id: 'tx-1', driverId: 'driver-1' }]);

    await service.findForDriver({ sub: 'user-1', email: 'driver@test.dev', role: Role.DRIVER });

    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      where: { driverId: 'driver-1' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  });
});
