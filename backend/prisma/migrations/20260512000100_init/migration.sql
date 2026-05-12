CREATE TYPE "Role" AS ENUM ('ADMIN', 'DRIVER', 'PASSENGER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "DriverStatus" AS ENUM ('OFFLINE', 'ONLINE', 'BUSY', 'SUSPENDED');
CREATE TYPE "OrderStatus" AS ENUM ('SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'DRIVER_PAYOUT', 'REFUND', 'BONUS', 'COMMISSION');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "passwordHash" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Driver" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "licenseNumber" TEXT NOT NULL,
  "vehicleMake" TEXT NOT NULL,
  "vehicleModel" TEXT NOT NULL,
  "vehicleColor" TEXT,
  "vehiclePlate" TEXT NOT NULL,
  "status" "DriverStatus" NOT NULL DEFAULT 'OFFLINE',
  "rating" DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Passenger" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rating" DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Passenger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tariff" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "carSupplyPrice" INTEGER NOT NULL,
  "pricePerKm" INTEGER NOT NULL,
  "freeWaitingMinutes" INTEGER NOT NULL,
  "waitingPricePerMinute" INTEGER NOT NULL,
  "stopPrice" INTEGER NOT NULL DEFAULT 0,
  "minimumOrderPrice" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'UZS',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "passengerId" TEXT NOT NULL,
  "driverId" TEXT,
  "tariffId" TEXT,
  "status" "OrderStatus" NOT NULL DEFAULT 'SEARCHING',
  "pickupAddress" TEXT NOT NULL,
  "pickupLat" DECIMAL(10,7) NOT NULL,
  "pickupLng" DECIMAL(10,7) NOT NULL,
  "dropoffAddress" TEXT NOT NULL,
  "dropoffLat" DECIMAL(10,7) NOT NULL,
  "dropoffLng" DECIMAL(10,7) NOT NULL,
  "distanceMeters" INTEGER,
  "durationSeconds" INTEGER,
  "fareCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'UZS',
  "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assignedAt" TIMESTAMP(3),
  "arrivedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Transaction" (
  "id" TEXT NOT NULL,
  "orderId" TEXT,
  "userId" TEXT,
  "driverId" TEXT,
  "passengerId" TEXT,
  "type" "TransactionType" NOT NULL,
  "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'UZS',
  "provider" TEXT,
  "providerRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DriverBalance" (
  "id" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "availableCents" INTEGER NOT NULL DEFAULT 0,
  "pendingCents" INTEGER NOT NULL DEFAULT 0,
  "lifetimeEarnedCents" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'UZS',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DriverBalance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DriverLocation" (
  "id" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "latitude" DECIMAL(10,7) NOT NULL,
  "longitude" DECIMAL(10,7) NOT NULL,
  "heading" DECIMAL(6,2),
  "speed" DECIMAL(6,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DriverLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderHistory" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL,
  "comment" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");
CREATE INDEX "User_firstName_lastName_idx" ON "User"("firstName", "lastName");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");
CREATE UNIQUE INDEX "Driver_licenseNumber_key" ON "Driver"("licenseNumber");
CREATE UNIQUE INDEX "Driver_vehiclePlate_key" ON "Driver"("vehiclePlate");
CREATE INDEX "Driver_status_idx" ON "Driver"("status");
CREATE INDEX "Driver_vehiclePlate_idx" ON "Driver"("vehiclePlate");

CREATE UNIQUE INDEX "Passenger_userId_key" ON "Passenger"("userId");

CREATE UNIQUE INDEX "Tariff_code_key" ON "Tariff"("code");
CREATE INDEX "Tariff_isActive_code_idx" ON "Tariff"("isActive", "code");
CREATE INDEX "Tariff_name_idx" ON "Tariff"("name");

CREATE INDEX "Order_status_requestedAt_idx" ON "Order"("status", "requestedAt");
CREATE INDEX "Order_passengerId_createdAt_idx" ON "Order"("passengerId", "createdAt");
CREATE INDEX "Order_driverId_createdAt_idx" ON "Order"("driverId", "createdAt");
CREATE INDEX "Order_pickupLat_pickupLng_idx" ON "Order"("pickupLat", "pickupLng");
CREATE INDEX "Order_dropoffLat_dropoffLng_idx" ON "Order"("dropoffLat", "dropoffLng");

CREATE INDEX "Transaction_orderId_idx" ON "Transaction"("orderId");
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");
CREATE INDEX "Transaction_driverId_createdAt_idx" ON "Transaction"("driverId", "createdAt");
CREATE INDEX "Transaction_passengerId_createdAt_idx" ON "Transaction"("passengerId", "createdAt");
CREATE INDEX "Transaction_status_createdAt_idx" ON "Transaction"("status", "createdAt");
CREATE INDEX "Transaction_providerRef_idx" ON "Transaction"("providerRef");

CREATE UNIQUE INDEX "DriverBalance_driverId_key" ON "DriverBalance"("driverId");
CREATE INDEX "DriverBalance_availableCents_idx" ON "DriverBalance"("availableCents");

CREATE INDEX "DriverLocation_driverId_createdAt_idx" ON "DriverLocation"("driverId", "createdAt");
CREATE INDEX "DriverLocation_latitude_longitude_idx" ON "DriverLocation"("latitude", "longitude");

CREATE INDEX "RefreshToken_userId_expiresAt_idx" ON "RefreshToken"("userId", "expiresAt");
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

CREATE INDEX "OrderHistory_orderId_createdAt_idx" ON "OrderHistory"("orderId", "createdAt");
CREATE INDEX "OrderHistory_status_createdAt_idx" ON "OrderHistory"("status", "createdAt");

ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DriverBalance" ADD CONSTRAINT "DriverBalance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverLocation" ADD CONSTRAINT "DriverLocation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderHistory" ADD CONSTRAINT "OrderHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
