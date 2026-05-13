CREATE TYPE "OrderOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELED');

ALTER TABLE "Order" ADD COLUMN "acceptedAt" TIMESTAMP(3);

CREATE TABLE "OrderOffer" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "OrderOfferStatus" NOT NULL DEFAULT 'PENDING',
    "offeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderOffer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderOffer_orderId_driverId_key" ON "OrderOffer"("orderId", "driverId");
CREATE INDEX "OrderOffer_orderId_idx" ON "OrderOffer"("orderId");
CREATE INDEX "OrderOffer_driverId_idx" ON "OrderOffer"("driverId");
CREATE INDEX "OrderOffer_status_idx" ON "OrderOffer"("status");
CREATE INDEX "OrderOffer_expiresAt_idx" ON "OrderOffer"("expiresAt");

ALTER TABLE "OrderOffer" ADD CONSTRAINT "OrderOffer_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderOffer" ADD CONSTRAINT "OrderOffer_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
