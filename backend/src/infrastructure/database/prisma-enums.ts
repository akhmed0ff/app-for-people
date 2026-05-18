/**
 * Re-exports Prisma enums as plain TypeScript const objects.
 * Values mirror prisma/schema.prisma exactly.
 */

export const Role = {
  ADMIN: 'ADMIN',
  DRIVER: 'DRIVER',
  PASSENGER: 'PASSENGER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const DriverStatus = {
  OFFLINE: 'OFFLINE',
  ONLINE: 'ONLINE',
  BUSY: 'BUSY',
  SUSPENDED: 'SUSPENDED',
} as const;
export type DriverStatus = (typeof DriverStatus)[keyof typeof DriverStatus];

export const OrderStatus = {
  SEARCHING: 'SEARCHING',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
  DRIVER_ARRIVED: 'DRIVER_ARRIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const OrderOfferStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CANCELED: 'CANCELED',
} as const;
export type OrderOfferStatus = (typeof OrderOfferStatus)[keyof typeof OrderOfferStatus];

export const TransactionType = {
  PAYMENT: 'PAYMENT',
  DRIVER_PAYOUT: 'DRIVER_PAYOUT',
  REFUND: 'REFUND',
  BONUS: 'BONUS',
  COMMISSION: 'COMMISSION',
  TOP_UP: 'TOP_UP',
  TRIP_COMMISSION: 'TRIP_COMMISSION',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionStatus = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELED: 'CANCELED',
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
