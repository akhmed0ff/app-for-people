import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Driver, DriverLocation, DriverStatus, OrderStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../../database/prisma.service';
import { AdminDriversQueryDto } from './dto/admin-drivers-query.dto';
import { NearbyDriversQueryDto } from './dto/nearby-drivers-query.dto';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { DriverMeProfile, NearbyDriver } from './drivers.types';
import { INTERNAL_REALTIME_EVENTS } from '../realtime/realtime.events';

const ACTIVE_ORDER_STATUSES = [
  OrderStatus.DRIVER_ASSIGNED,
  OrderStatus.DRIVER_ARRIVED,
  OrderStatus.IN_PROGRESS,
] as const;

const MANUAL_DRIVER_STATUSES = [DriverStatus.ONLINE, DriverStatus.OFFLINE] as const;
const LOCATION_ALLOWED_STATUSES = [DriverStatus.ONLINE, DriverStatus.BUSY] as const;
const MAX_NEARBY_DRIVERS = 20;
const EARTH_RADIUS_KM = 6371;

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getMe(user: AuthenticatedUser): Promise<DriverMeProfile> {
    const driver = await this.getDriverByUserId(user.id);
    const [currentLocation, activeOrder] = await Promise.all([
      this.prisma.driverLocation.findUnique({
        where: { driverId: driver.id },
      }),
      this.findActiveOrder(driver.id),
    ]);

    return {
      user,
      driver,
      currentLocation,
      activeOrder,
    };
  }

  async updateStatus(user: AuthenticatedUser, dto: UpdateDriverStatusDto): Promise<Driver> {
    if (!MANUAL_DRIVER_STATUSES.includes(dto.status as (typeof MANUAL_DRIVER_STATUSES)[number])) {
      throw new BadRequestException('Driver can only switch manually between ONLINE and OFFLINE');
    }

    const driver = await this.getDriverByUserId(user.id);

    if (driver.status === DriverStatus.BLOCKED) {
      throw new ForbiddenException('Blocked driver cannot change status');
    }

    const activeOrder = await this.findActiveOrder(driver.id);

    if (activeOrder) {
      throw new BadRequestException('Driver cannot change status during active order');
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id: driver.id },
      data: { status: dto.status },
    });

    this.eventEmitter.emit(INTERNAL_REALTIME_EVENTS.DRIVER_STATUS_UPDATED, {
      driverId: updatedDriver.id,
      status: updatedDriver.status,
    });

    return updatedDriver;
  }

  async updateLocation(
    user: AuthenticatedUser,
    dto: UpdateDriverLocationDto,
  ): Promise<DriverLocation> {
    this.assertCoordinates(dto.lat, dto.lng);

    const driver = await this.getDriverByUserId(user.id);

    if (!LOCATION_ALLOWED_STATUSES.includes(driver.status as (typeof LOCATION_ALLOWED_STATUSES)[number])) {
      throw new BadRequestException('Driver location can be updated only while ONLINE or BUSY');
    }

    const location = await this.prisma.driverLocation.upsert({
      where: { driverId: driver.id },
      update: {
        lat: dto.lat,
        lng: dto.lng,
        heading: dto.heading,
        speed: dto.speed,
      },
      create: {
        driverId: driver.id,
        lat: dto.lat,
        lng: dto.lng,
        heading: dto.heading,
        speed: dto.speed,
      },
    });

    const activeOrder = await this.findActiveOrder(driver.id);

    this.eventEmitter.emit(INTERNAL_REALTIME_EVENTS.DRIVER_LOCATION_UPDATED, {
      driverId: driver.id,
      orderId: activeOrder?.id,
      location,
    });

    return location;
  }

  async findNearby(query: NearbyDriversQueryDto): Promise<NearbyDriver[]> {
    this.assertCoordinates(query.lat, query.lng);

    const drivers = await this.prisma.driver.findMany({
      where: {
        status: DriverStatus.ONLINE,
        location: {
          isNot: null,
        },
      },
      include: {
        location: true,
      },
    });

    return drivers
      .filter((driver): driver is Driver & { location: DriverLocation } => Boolean(driver.location))
      .map((driver) => ({
        driverId: driver.id,
        carModel: driver.carModel,
        carNumber: driver.carNumber,
        rating: driver.rating,
        status: driver.status,
        location: driver.location,
        distanceKm: this.roundDistance(
          this.calculateDistanceKm(query.lat, query.lng, driver.location.lat, driver.location.lng),
        ),
      }))
      .filter((driver) => driver.distanceKm <= query.radiusKm)
      .sort((first, second) => first.distanceKm - second.distanceKm)
      .slice(0, MAX_NEARBY_DRIVERS);
  }

  findAdmin(query: AdminDriversQueryDto): Promise<Driver[]> {
    return this.prisma.driver.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async block(driverId: string): Promise<Driver> {
    await this.ensureDriverExists(driverId);

    return this.prisma.driver.update({
      where: { id: driverId },
      data: { status: DriverStatus.BLOCKED },
    });
  }

  async unblock(driverId: string): Promise<Driver> {
    await this.ensureDriverExists(driverId);

    return this.prisma.driver.update({
      where: { id: driverId },
      data: { status: DriverStatus.OFFLINE },
    });
  }

  private async getDriverByUserId(userId: string): Promise<Driver> {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new ForbiddenException('Driver profile was not found');
    }

    return driver;
  }

  private async ensureDriverExists(driverId: string): Promise<void> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver was not found');
    }
  }

  private findActiveOrder(driverId: string) {
    return this.prisma.order.findFirst({
      where: {
        driverId,
        status: {
          in: [...ACTIVE_ORDER_STATUSES],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private assertCoordinates(lat: number, lng: number): void {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('Invalid coordinates');
    }
  }

  private calculateDistanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
    const latDelta = this.toRadians(toLat - fromLat);
    const lngDelta = this.toRadians(toLng - fromLng);
    const fromLatRad = this.toRadians(fromLat);
    const toLatRad = this.toRadians(toLat);

    const haversine =
      Math.sin(latDelta / 2) ** 2 +
      Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(lngDelta / 2) ** 2;

    return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private roundDistance(distanceKm: number): number {
    return Math.round(distanceKm * 100) / 100;
  }
}
