import {
  OrderStatus,
  PaymentMethod,
  PrismaClient,
  Role,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ANGREN = {
  center: {
    lat: 41.0167,
    lng: 70.1436,
  },
  fifthMicrodistrict: {
    address: '5-й микрорайон, Ангрен',
    lat: 41.0198,
    lng: 70.1284,
  },
  bazar: {
    address: 'Базар Ангрен',
    lat: 41.0125,
    lng: 70.1393,
  },
};

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@taxi.local' },
    update: {
      phone: null,
      passwordHash,
      firstName: 'Aziza',
      lastName: 'Karimova',
      role: Role.ADMIN,
    },
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
    update: {
      phone: '+998901112233',
      passwordHash,
      firstName: 'Jasur',
      lastName: 'Tursunov',
      role: Role.DRIVER,
    },
    create: {
      email: 'driver@taxi.local',
      phone: '+998901112233',
      passwordHash,
      firstName: 'Jasur',
      lastName: 'Tursunov',
      role: Role.DRIVER,
    },
  });

  const passengerUser = await prisma.user.upsert({
    where: { email: 'passenger@taxi.local' },
    update: {
      phone: '+998902224455',
      passwordHash,
      firstName: 'Dilshod',
      lastName: 'Rahimov',
      role: Role.PASSENGER,
    },
    create: {
      email: 'passenger@taxi.local',
      phone: '+998902224455',
      passwordHash,
      firstName: 'Dilshod',
      lastName: 'Rahimov',
      role: Role.PASSENGER,
    },
  });

  let driver = await prisma.driver.findUnique({
    where: { userId: driverUser.id },
  });

  if (!driver) {
    driver = await prisma.driver.create({
      data: {
        userId: driverUser.id,
        licenseNumber: 'ANG-0001',
        vehicleMake: 'Chevrolet',
        vehicleModel: 'Cobalt',
        vehicleColor: 'White',
        vehiclePlate: '10 A 123 AA',
        balance: 125000,
        commissionRatePercent: 10,
      },
    });
  }

  let passenger = await prisma.passenger.findUnique({
    where: { userId: passengerUser.id },
  });

  if (!passenger) {
    passenger = await prisma.passenger.create({
      data: {
        userId: passengerUser.id,
      },
    });
  }

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
      currency: 'UZS',
      isActive: true,
    },
    {
      code: 'COMFORT',
      name: 'Комфорт',
      description:
        'Комфортные поездки между микрорайонами, вокзалом и центром Ангрена.',
      carSupplyPrice: 9000,
      pricePerKm: 2500,
      freeWaitingMinutes: 5,
      waitingPricePerMinute: 800,
      stopPrice: 1500,
      minimumOrderPrice: 11000,
      currency: 'UZS',
      isActive: true,
    },
    {
      code: 'PREMIUM',
      name: 'Премиум',
      description:
        'Премиальные поездки в промзону, на угольный разрез и ночные поездки.',
      carSupplyPrice: 18000,
      pricePerKm: 4000,
      freeWaitingMinutes: 10,
      waitingPricePerMinute: 1500,
      stopPrice: 3000,
      minimumOrderPrice: 22000,
      currency: 'UZS',
      isActive: true,
    },
  ];

  for (const tariff of tariffs) {
    await prisma.tariff.upsert({
      where: { code: tariff.code },
      update: tariff,
      create: tariff,
    });
  }

  const economy = await prisma.tariff.findUnique({
    where: { code: 'ECONOMY' },
  });

  if (!economy) {
    throw new Error('ECONOMY tariff was not created');
  }

  const existingLocation = await prisma.driverLocation.findFirst({
    where: { driverId: driver.id },
  });

  if (existingLocation) {
    await prisma.driverLocation.update({
      where: { id: existingLocation.id },
      data: {
        latitude: ANGREN.center.lat,
        longitude: ANGREN.center.lng,
        heading: 90,
        speed: 0,
      },
    });
  } else {
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
    where: {
      passengerId: passenger.id,
      driverId: driver.id,
      tariffId: economy.id,
      pickupAddress: ANGREN.fifthMicrodistrict.address,
      dropoffAddress: ANGREN.bazar.address,
    },
  });

  if (!existingOrder) {
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
        routeDurationMinutes: 8,
        fareCents: 10500,
        currency: 'UZS',
        paymentMethod: PaymentMethod.CASH,
        assignedAt: new Date(),
        acceptedAt: new Date(),
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
        status: TransactionStatus.SUCCESS,
        amount: 10500,
        amountCents: 10500,
        currency: 'UZS',
        description: 'Demo cash payment for Angren order.',
        provider: 'cash',
        providerRef: `seed-cash-${order.id}`,
      },
    });
  }

  console.log('Seed completed successfully');
  console.log({
    adminEmail: adminUser.email,
    driverEmail: driverUser.email,
    passengerEmail: passengerUser.email,
    password: 'Password123!',
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  