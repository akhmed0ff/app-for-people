import { OrderStatus, PaymentMethod, PrismaClient, Role, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ANGREN = {
  center: { lat: 41.0167, lng: 70.1436 },
  fifthMicrodistrict: { address: '5-й микрорайон, Ангрен', lat: 41.0198, lng: 70.1284 },
  bazar: { address: 'Базар Ангрен', lat: 41.0125, lng: 70.1393 },
};

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@taxi.local' },
    update: {},
    create: {
      email: 'admin@taxi.local',
      passwordHash,
      firstName: 'Aziza',
      lastName: 'Karimova',
      role: Role.ADMIN,
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@taxi.local' },
    update: {},
    create: {
      email: 'driver@taxi.local',
      phone: '+998901112233',
      passwordHash,
      firstName: 'Jasur',
      lastName: 'Tursunov',
      role: Role.DRIVER,
      driver: {
        create: {
          licenseNumber: 'ANG-0001',
          vehicleMake: 'Chevrolet',
          vehicleModel: 'Cobalt',
          vehicleColor: 'White',
          vehiclePlate: '10 A 123 AA',
          balance: 125000,
          balanceAccount: {
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
      phone: '+998902224455',
      passwordHash,
      firstName: 'Dilshod',
      lastName: 'Rahimov',
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
      description: 'Базовый тариф для коротких городских поездок по Ангрену.',
      carSupplyPrice: 6000,
      pricePerKm: 1800,
      freeWaitingMinutes: 3,
      waitingPricePerMinute: 500,
      stopPrice: 1000,
      minimumOrderPrice: 8000,
    },
    {
      code: 'COMFORT',
      name: 'Комфорт',
      description: 'Комфортные поездки между микрорайонами, вокзалом и центром Ангрена.',
      carSupplyPrice: 9000,
      pricePerKm: 2500,
      freeWaitingMinutes: 5,
      waitingPricePerMinute: 800,
      stopPrice: 1500,
      minimumOrderPrice: 11000,
    },
    {
      code: 'PREMIUM',
      name: 'Премиум',
      description: 'Премиальные поездки в промзону, на угольный разрез и ночные поездки.',
      carSupplyPrice: 18000,
      pricePerKm: 4000,
      freeWaitingMinutes: 10,
      waitingPricePerMinute: 1500,
      stopPrice: 3000,
      minimumOrderPrice: 22000,
    },
  ];

  for (const tariff of tariffs) {
    await prisma.tariff.upsert({
      where: { code: tariff.code },
      update: { ...tariff, currency: 'UZS' },
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
        latitude: ANGREN.center.lat,
        longitude: ANGREN.center.lng,
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
      pickupAddress: ANGREN.fifthMicrodistrict.address,
      pickupLat: ANGREN.fifthMicrodistrict.lat,
      pickupLng: ANGREN.fifthMicrodistrict.lng,
      dropoffAddress: ANGREN.bazar.address,
      dropoffLat: ANGREN.bazar.lat,
      dropoffLng: ANGREN.bazar.lng,
      distanceMeters: 2500,
      durationSeconds: 480,
      fareCents: 10500,
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
        comment: 'Demo Angren order created by seed.',
      },
      {
        orderId: order.id,
        status: OrderStatus.DRIVER_ASSIGNED,
        comment: 'Angren demo driver assigned.',
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
      amount: 10500,
      amountCents: 10500,
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
