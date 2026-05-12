import { OrderStatus, PaymentMethod, PrismaClient, Role, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@taxi.local' },
    update: {},
    create: {
      email: 'admin@taxi.local',
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      role: Role.ADMIN,
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@taxi.local' },
    update: {},
    create: {
      email: 'driver@taxi.local',
      phone: '+10000000002',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Driver',
      role: Role.DRIVER,
      driver: {
        create: {
          licenseNumber: 'DRV-0001',
          vehicleMake: 'Toyota',
          vehicleModel: 'Prius',
          vehicleColor: 'White',
          vehiclePlate: 'TAXI-001',
          balance: {
            create: {
              availableCents: 125000,
              pendingCents: 25000,
              lifetimeEarnedCents: 450000,
              currency: 'UZS',
            },
          },
        },
      },
    },
  });

  const passengerUser = await prisma.user.upsert({
    where: { email: 'passenger@taxi.local' },
    update: {},
    create: {
      email: 'passenger@taxi.local',
      phone: '+10000000003',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Passenger',
      role: Role.PASSENGER,
      passenger: {
        create: {},
      },
    },
  });

  const tariffs = [
    {
      code: 'ECONOMY',
      name: 'Эконом',
      description: 'Базовый тариф для ежедневных поездок.',
      carSupplyPrice: 8000,
      pricePerKm: 2000,
      freeWaitingMinutes: 3,
      waitingPricePerMinute: 500,
      stopPrice: 1000,
      minimumOrderPrice: 8000,
    },
    {
      code: 'COMFORT',
      name: 'Комфорт',
      description: 'Более просторные машины и выше рейтинг водителей.',
      carSupplyPrice: 12000,
      pricePerKm: 3000,
      freeWaitingMinutes: 5,
      waitingPricePerMinute: 1000,
      stopPrice: 2000,
      minimumOrderPrice: 12000,
    },
    {
      code: 'PREMIUM',
      name: 'Премиум',
      description: 'Премиальные автомобили для важных поездок.',
      carSupplyPrice: 25000,
      pricePerKm: 5000,
      freeWaitingMinutes: 10,
      waitingPricePerMinute: 2000,
      stopPrice: 5000,
      minimumOrderPrice: 25000,
    },
  ];

  for (const tariff of tariffs) {
    await prisma.tariff.upsert({
      where: { code: tariff.code },
      update: tariff,
      create: {
        ...tariff,
        currency: 'UZS',
      },
    });
  }

  const driver = await prisma.driver.findUnique({ where: { userId: driverUser.id } });
  const passenger = await prisma.passenger.findUnique({ where: { userId: passengerUser.id } });
  const economy = await prisma.tariff.findUnique({ where: { code: 'ECONOMY' } });

  if (!driver || !passenger || !economy) {
    return;
  }

  const existingLocation = await prisma.driverLocation.findFirst({
    where: { driverId: driver.id },
  });

  if (!existingLocation) {
    await prisma.driverLocation.create({
      data: {
        driverId: driver.id,
        latitude: 41.2995,
        longitude: 69.2401,
        heading: 90,
        speed: 0,
      },
    });
  }

  const existingOrder = await prisma.order.findFirst({
    where: { passengerId: passenger.id, tariffId: economy.id },
  });

  if (existingOrder) {
    return;
  }

  const order = await prisma.order.create({
    data: {
      passengerId: passenger.id,
      driverId: driver.id,
      tariffId: economy.id,
      status: OrderStatus.DRIVER_ASSIGNED,
      pickupAddress: 'Amir Temur Square, Tashkent',
      pickupLat: 41.3111,
      pickupLng: 69.2797,
      dropoffAddress: 'Tashkent City Park',
      dropoffLat: 41.3167,
      dropoffLng: 69.2486,
      distanceMeters: 4200,
      durationSeconds: 780,
      fareCents: 17400,
      currency: 'UZS',
      paymentMethod: PaymentMethod.CASH,
      assignedAt: new Date(),
    },
  });

  await prisma.orderHistory.createMany({
    data: [
      {
        orderId: order.id,
        status: OrderStatus.SEARCHING,
        comment: 'Order created by seed.',
      },
      {
        orderId: order.id,
        status: OrderStatus.DRIVER_ASSIGNED,
        comment: 'Demo driver assigned.',
      },
    ],
  });

  await prisma.transaction.create({
    data: {
      orderId: order.id,
      userId: passengerUser.id,
      passengerId: passenger.id,
      driverId: driver.id,
      type: TransactionType.PAYMENT,
      amountCents: 17400,
      currency: 'UZS',
      provider: 'cash',
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
