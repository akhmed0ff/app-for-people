import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Role as PrismaRole } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { Role } from '../../domain/auth/role.enum';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { JwtUser } from '../auth/auth.types';
import {
  AuthenticatedSocketData,
  ClientToServerEvents,
  DispatchOrderPayload,
  DriverLocationPayload,
  EtaPayload,
  EtaResult,
  NearestDriverPayload,
  OrderActionPayload,
  OrderStatusPayload,
  Rooms,
  ServerToClientEvents,
  SocketEvent,
} from './socket-events';

type AuthedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: AuthenticatedSocketData;
};
type TaxiServer = Server<ClientToServerEvents, ServerToClientEvents>;

const GEO_DRIVERS_KEY = 'geo:drivers:online';
const DRIVER_SOCKET_PREFIX = 'socket:driver:';
const USER_SOCKET_PREFIX = 'socket:user:';
const HEARTBEAT_TTL_SECONDS = 45;

@Injectable()
export class TaxiRealtimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async attachClient(socket: AuthedSocket, user: JwtUser) {
    socket.data.user = user;
    socket.data.role = user.role;
    socket.join(`user:${user.sub}`);

    await this.redis.client.setex(`${USER_SOCKET_PREFIX}${user.sub}`, HEARTBEAT_TTL_SECONDS, socket.id);

    if (user.role === Role.ADMIN) {
      socket.join(Rooms.admins);
      return;
    }

    if (user.role === Role.DRIVER) {
      const driver = await this.prisma.driver.findUnique({ where: { userId: user.sub } });
      if (driver) {
        socket.data.driverId = driver.id;
        socket.join(Rooms.driver(driver.id));
      }
      return;
    }

    if (user.role === Role.PASSENGER) {
      const passenger = await this.prisma.passenger.findUnique({ where: { userId: user.sub } });
      if (passenger) {
        socket.data.passengerId = passenger.id;
        socket.join(Rooms.passenger(passenger.id));
      }
    }
  }

  async detachClient(socket: AuthedSocket) {
    if (socket.data.driverId) {
      const activeSocketId = await this.redis.client.get(`${DRIVER_SOCKET_PREFIX}${socket.data.driverId}`);
      if (activeSocketId === socket.id) {
        await this.setDriverOffline(socket.data.driverId);
      }
    }
    if (socket.data.user?.sub) {
      await this.redis.client.del(`${USER_SOCKET_PREFIX}${socket.data.user.sub}`);
    }
  }

  async heartbeat(socket: AuthedSocket) {
    if (socket.data.user?.sub) {
      await this.redis.client.setex(
        `${USER_SOCKET_PREFIX}${socket.data.user.sub}`,
        HEARTBEAT_TTL_SECONDS,
        socket.id,
      );
    }
    if (socket.data.driverId) {
      await this.redis.client.setex(
        `${DRIVER_SOCKET_PREFIX}${socket.data.driverId}`,
        HEARTBEAT_TTL_SECONDS,
        socket.id,
      );
    }

    return { ok: true, serverTime: new Date().toISOString() };
  }

  async setDriverOnline(socket: AuthedSocket, server: TaxiServer, payload?: DriverLocationPayload) {
    const driverId = await this.resolveDriverId(socket, payload?.driverId);
    await this.prisma.driver.update({ where: { id: driverId }, data: { status: 'ONLINE' } });
    await this.redis.client.setex(`${DRIVER_SOCKET_PREFIX}${driverId}`, HEARTBEAT_TTL_SECONDS, socket.id);
    socket.join(Rooms.driver(driverId));
    socket.join(Rooms.driversOnline);

    if (payload) {
      await this.updateDriverLocation(socket, server, payload);
    }

    const event = { driverId, status: 'ONLINE' as const };
    server.to(Rooms.admins).emit(SocketEvent.DriverOnline, event);
    return event;
  }

  async setDriverOffline(driverId: string) {
    await this.prisma.driver.update({ where: { id: driverId }, data: { status: 'OFFLINE' } });
    await this.redis.client.zrem(GEO_DRIVERS_KEY, driverId);
    await this.redis.client.del(`${DRIVER_SOCKET_PREFIX}${driverId}`);
    return { driverId, status: 'OFFLINE' as const };
  }

  async updateDriverLocation(socket: AuthedSocket, server: TaxiServer, payload: DriverLocationPayload) {
    const driverId = await this.resolveDriverId(socket, payload.driverId);
    const location = await this.prisma.driverLocation.create({
      data: {
        driverId,
        latitude: payload.latitude,
        longitude: payload.longitude,
        heading: payload.heading,
        speed: payload.speed,
      },
    });

    await this.redis.client.geoadd(
      GEO_DRIVERS_KEY,
      payload.longitude,
      payload.latitude,
      driverId,
    );
    await this.redis.client.setex(`${DRIVER_SOCKET_PREFIX}${driverId}`, HEARTBEAT_TTL_SECONDS, socket.id);

    const event = {
      driverId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      heading: payload.heading,
      speed: payload.speed,
      updatedAt: location.createdAt,
    };

    server.to(Rooms.admins).emit(SocketEvent.DriverLocationUpdated, event);
    server.to(Rooms.driversOnline).emit(SocketEvent.DriverLocationUpdated, event);

    const activeOrders = await this.prisma.order.findMany({
      where: {
        driverId,
        status: {
          in: [OrderStatus.DRIVER_ASSIGNED, OrderStatus.DRIVER_ARRIVED, OrderStatus.IN_PROGRESS],
        },
      },
      select: { id: true, passengerId: true },
    });

    for (const order of activeOrders) {
      server
        .to([Rooms.order(order.id), Rooms.passenger(order.passengerId)])
        .emit(SocketEvent.DriverLocationUpdated, event);
    }

    return event;
  }

  async findNearestDrivers(payload: NearestDriverPayload) {
    const radiusMeters = payload.radiusMeters ?? 3000;
    const limit = payload.limit ?? 10;
    const raw = await this.redis.client.georadius(
      GEO_DRIVERS_KEY,
      payload.longitude,
      payload.latitude,
      radiusMeters,
      'm',
      'WITHDIST',
      'ASC',
      'COUNT',
      limit,
    );

    return raw.map((item) => {
      const [driverId, distance] = item as [string, string];
      return { driverId, distanceMeters: Math.round(Number(distance)) };
    });
  }

  async dispatchOrder(server: TaxiServer, payload: DispatchOrderPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: payload.orderId },
      include: { passenger: true, tariff: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const drivers = await this.findNearestDrivers({
      latitude: Number(order.pickupLat),
      longitude: Number(order.pickupLng),
      radiusMeters: payload.radiusMeters,
      limit: payload.limit,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.SEARCHING,
        history: {
          create: {
            status: OrderStatus.SEARCHING,
            comment: `Dispatched to ${drivers.length} nearby drivers.`,
          },
        },
      },
    });

    const offer = {
      orderId: order.id,
      pickupAddress: order.pickupAddress,
      pickupLat: order.pickupLat,
      pickupLng: order.pickupLng,
      dropoffAddress: order.dropoffAddress,
      dropoffLat: order.dropoffLat,
      dropoffLng: order.dropoffLng,
      tariff: order.tariff,
    };

    for (const driver of drivers) {
      server.to(Rooms.driver(driver.driverId)).emit(SocketEvent.OrderOffered, {
        ...offer,
        distanceToPickupMeters: driver.distanceMeters,
      });
    }

    server.to(Rooms.order(order.id)).emit(SocketEvent.OrderDispatch, { orderId: order.id, drivers });
    return { orderId: order.id, drivers };
  }

  async acceptOrder(socket: AuthedSocket, server: TaxiServer, payload: OrderActionPayload) {
    const driverId = await this.resolveDriverId(socket);
    const order = await this.prisma.$transaction(async (tx) => {
      const accepted = await tx.order.updateMany({
        where: {
          id: payload.orderId,
          status: OrderStatus.SEARCHING,
          driverId: null,
        },
        data: {
          driverId,
          status: OrderStatus.DRIVER_ASSIGNED,
          assignedAt: new Date(),
        },
      });

      if (accepted.count !== 1) {
        throw new ConflictException('Order is no longer available');
      }

      await tx.orderHistory.create({
        data: {
          orderId: payload.orderId,
          status: OrderStatus.DRIVER_ASSIGNED,
          comment: `Accepted by driver ${driverId}.`,
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: payload.orderId },
        include: {
          passenger: true,
          driver: true,
          tariff: true,
          transactions: true,
          history: true,
          },
      });
    });

    socket.join(Rooms.order(order.id));
    server.to([Rooms.order(order.id), Rooms.passenger(order.passengerId)]).emit(SocketEvent.OrderAccepted, order);
    server.to(Rooms.admins).emit(SocketEvent.OrderAccepted, order);
    return order;
  }

  async cancelOrder(socket: AuthedSocket, server: TaxiServer, payload: OrderActionPayload) {
    await this.ensureCanManageOrder(socket, payload.orderId);

    const order = await this.prisma.order.update({
      where: { id: payload.orderId },
      data: {
        status: OrderStatus.CANCELED,
        canceledAt: new Date(),
        history: {
          create: {
            status: OrderStatus.CANCELED,
            comment: payload.reason ?? `Canceled by ${socket.data.user.role}.`,
          },
        },
      },
    });

    server.to([Rooms.order(order.id), Rooms.passenger(order.passengerId)]).emit(SocketEvent.OrderCanceled, order);
    server.to(Rooms.admins).emit(SocketEvent.OrderCanceled, order);
    return order;
  }

  async updateOrderStatus(socket: AuthedSocket, server: TaxiServer, payload: OrderStatusPayload) {
    await this.ensureCanManageOrder(socket, payload.orderId);

    const timestamps = {
      [OrderStatus.DRIVER_ARRIVED]: { arrivedAt: new Date() },
      [OrderStatus.IN_PROGRESS]: { startedAt: new Date() },
      [OrderStatus.COMPLETED]: { completedAt: new Date() },
      [OrderStatus.CANCELED]: { canceledAt: new Date() },
      [OrderStatus.SEARCHING]: {},
      [OrderStatus.DRIVER_ASSIGNED]: { assignedAt: new Date() },
    };
    const order = await this.prisma.order.update({
      where: { id: payload.orderId },
      data: {
        status: payload.status,
        ...timestamps[payload.status],
        history: {
          create: {
            status: payload.status,
            comment: `Status updated by ${socket.data.user.role}.`,
          },
        },
      },
    });

    server.to([Rooms.order(order.id), Rooms.passenger(order.passengerId)]).emit(SocketEvent.OrderStatusUpdated, order);
    server.to(Rooms.admins).emit(SocketEvent.OrderStatusUpdated, order);
    return order;
  }

  calculateEta(payload: EtaPayload): EtaResult {
    const distanceMeters = this.haversineMeters(
      payload.driverLat,
      payload.driverLng,
      payload.destinationLat,
      payload.destinationLng,
    );
    const averageUrbanSpeedMetersPerSecond = 8.3;
    return {
      orderId: payload.orderId,
      distanceMeters: Math.round(distanceMeters),
      etaSeconds: Math.max(60, Math.round(distanceMeters / averageUrbanSpeedMetersPerSecond)),
    };
  }

  canUseDriverActions(socket: AuthedSocket) {
    return socket.data.role === Role.DRIVER || socket.data.role === Role.ADMIN;
  }

  canUseAdminActions(socket: AuthedSocket) {
    return socket.data.role === Role.ADMIN;
  }

  private async resolveDriverId(socket: AuthedSocket, payloadDriverId?: string) {
    if (socket.data.role === Role.ADMIN && payloadDriverId) {
      return payloadDriverId;
    }
    if (socket.data.driverId) {
      return socket.data.driverId;
    }
    const driver = await this.prisma.driver.findUnique({ where: { userId: socket.data.user.sub } });
    if (!driver || socket.data.user.role !== PrismaRole.DRIVER) {
      throw new NotFoundException('Driver profile not found');
    }
    socket.data.driverId = driver.id;
    return driver.id;
  }

  private async ensureCanManageOrder(socket: AuthedSocket, orderId: string) {
    if (socket.data.role === Role.ADMIN) {
      return;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        passengerId: true,
        driverId: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (socket.data.role === Role.PASSENGER && order.passengerId !== socket.data.passengerId) {
      throw new ConflictException('Passenger can only manage their own order');
    }

    if (socket.data.role === Role.DRIVER) {
      const driverId = await this.resolveDriverId(socket);
      if (order.driverId !== driverId) {
        throw new ConflictException('Driver can only manage their assigned order');
      }
    }
  }

  private haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const earthRadiusMeters = 6371000;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
