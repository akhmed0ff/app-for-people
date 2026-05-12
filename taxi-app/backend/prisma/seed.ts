import {
  DriverStatus,
  PrismaClient,
  TransactionType,
  UserRole,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { phone: '+998900000001' },
    update: {
      name: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      phone: '+998900000001',
      name: 'Admin',
      role: UserRole.ADMIN,
    },
  });

  const passengerUser = await prisma.user.upsert({
    where: { phone: '+998900000002' },
    update: {
      name: 'Test Passenger',
      role: UserRole.PASSENGER,
      isActive: true,
    },
    create: {
      phone: '+998900000002',
      name: 'Test Passenger',
      role: UserRole.PASSENGER,
    },
  });

  await prisma.passenger.upsert({
    where: { userId: passengerUser.id },
    update: {},
    create: {
      userId: passengerUser.id,
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { phone: '+998900000003' },
    update: {
      name: 'Test Driver',
      role: UserRole.DRIVER,
      isActive: true,
    },
    create: {
      phone: '+998900000003',
      name: 'Test Driver',
      role: UserRole.DRIVER,
    },
  });

  const driver = await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {
      carModel: 'Chevrolet Cobalt',
      carNumber: '01 A 777 AA',
      status: DriverStatus.OFFLINE,
    },
    create: {
      userId: driverUser.id,
      carModel: 'Chevrolet Cobalt',
      carNumber: '01 A 777 AA',
      status: DriverStatus.OFFLINE,
      balance: 0,
      rating: 5,
    },
  });

  await prisma.driverLocation.upsert({
    where: { driverId: driver.id },
    update: {
      lat: 41.311081,
      lng: 69.240562,
      heading: 0,
      speed: 0,
    },
    create: {
      driverId: driver.id,
      lat: 41.311081,
      lng: 69.240562,
      heading: 0,
      speed: 0,
    },
  });

  await prisma.tariff.upsert({
    where: { code: 'ECONOMY' },
    update: {
      name: 'Эконом',
      baseFare: 8000,
      pricePerKm: 2000,
      freeWaitingMinutes: 3,
      waitingPricePerMinute: 500,
      stopPricePerMinute: 500,
      minimumFare: 10000,
      isActive: true,
    },
    create: {
      code: 'ECONOMY',
      name: 'Эконом',
      baseFare: 8000,
      pricePerKm: 2000,
      freeWaitingMinutes: 3,
      waitingPricePerMinute: 500,
      stopPricePerMinute: 500,
      minimumFare: 10000,
    },
  });

  await prisma.tariff.upsert({
    where: { code: 'COMFORT' },
    update: {
      name: 'Комфорт',
      baseFare: 12000,
      pricePerKm: 3000,
      freeWaitingMinutes: 5,
      waitingPricePerMinute: 1000,
      stopPricePerMinute: 1000,
      minimumFare: 15000,
      isActive: true,
    },
    create: {
      code: 'COMFORT',
      name: 'Комфорт',
      baseFare: 12000,
      pricePerKm: 3000,
      freeWaitingMinutes: 5,
      waitingPricePerMinute: 1000,
      stopPricePerMinute: 1000,
      minimumFare: 15000,
    },
  });

  await prisma.tariff.upsert({
    where: { code: 'PREMIUM' },
    update: {
      name: 'Премиум',
      baseFare: 25000,
      pricePerKm: 5000,
      freeWaitingMinutes: 10,
      waitingPricePerMinute: 2000,
      stopPricePerMinute: 2000,
      minimumFare: 30000,
      isActive: true,
    },
    create: {
      code: 'PREMIUM',
      name: 'Премиум',
      baseFare: 25000,
      pricePerKm: 5000,
      freeWaitingMinutes: 10,
      waitingPricePerMinute: 2000,
      stopPricePerMinute: 2000,
      minimumFare: 30000,
    },
  });

  await prisma.transaction.upsert({
    where: { id: 'seed-driver-initial-balance' },
    update: {},
    create: {
      id: 'seed-driver-initial-balance',
      driverId: driver.id,
      amount: 0,
      type: TransactionType.ADJUSTMENT,
      description: 'Initial seed balance',
    },
  });

  console.log(`Seed completed: ${admin.phone}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
