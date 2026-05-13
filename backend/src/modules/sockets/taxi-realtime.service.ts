import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Role as PrismaRole } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { Role } from '../../domain/auth/role.enum';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { JwtUser } from '../auth/auth.types';
import { BalanceService } from '../balance/balance.service';
import { MatchingService } from '../matching/matching.service';
import { PushService } from '../push/push.service';
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
    private readonly pushService: PushService,
    private readonly balanceService: BalanceService,
    private readonly matchingService: MatchingService,
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
 
    // geosearch заменяет устаревший georadius (Redis 6.2+)
    const raw = await this.redis.client.geosearch(
      GEO_DRIVERS_KEY,
      'FROMLONLAT',
      payload.longitude,
      payload.latitude,
      'BYRADIUS',
      radiusMeters,
      'm',
      'ASC',
      'COUNT',
      limit,
      'WITHDIST',
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
 
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.SEARCHING,
        history: {
          create: {
            status: OrderStatus.SEARCHING,
            comment: 'Matching started.',
          },
        },
      },
    });
    const offer = await this.matchingService.startMatching(order.id);
    server.to(Rooms.order(order.id)).emit(SocketEvent.OrderDispatch, { orderId: order.id, offer });
    return { orderId: order.id, offer };
  }
 
  async acceptOrder(socket: AuthedSocket, server: TaxiServer, payload: OrderActionPayload) {
    const order = await this.matchingService.acceptOrder(socket.data.user, payload.orderId);
    socket.join(Rooms.order(order.id));
    return order;
  }
 
  async joinOrder(socket: AuthedSocket, payload: OrderActionPayload) {
    await this.ensureCanViewOrder(socket, payload.orderId);
    socket.join(Rooms.order(payload.orderId));
    return { orderId: payload.orderId, joined: true };
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
 
    await this.matchingService.cancelOffers(order.id, 'ORDER_CANCELED');
 
    server.to([Rooms.order(order.id), Rooms.passenger(order.passengerId)]).emit(SocketEvent.OrderCanceled, order);
    server.to(Rooms.admins).emit(SocketEvent.OrderCanceled, order);
    void this.pushService.notifyPassenger(order.passengerId, {
      type: 'ORDER_CANCELED',
      orderId: order.id,
      role: 'PASSENGER',
    });
    if (order.driverId && socket.data.role === Role.PASSENGER) {
      void this.pushService.notifyDriver(order.driverId, {
        type: 'ORDER_CANCELED',
        orderId: order.id,
        role: 'DRIVER',
      });
    }
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
    const order =
      payload.status === OrderStatus.COMPLETED
        ? await this.balanceService.completeOrderWithCommission(
            payload.orderId,
            `Completed by ${socket.data.user.role}.`,
          )
        : await this.prisma.order.update({
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
    const pushType = this.pushTypeForStatus(payload.status);
    if (pushType) {
      void this.pushService.notifyPassenger(order.passengerId, {
        type: pushType,
        orderId: order.id,
        role: 'PASSENGER',
      });
    }
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
 
  private async ensureCanViewOrder(socket: AuthedSocket, orderId: string) {
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
      throw new ConflictException('Passenger can only view their own order');
    }
 
    if (socket.data.role === Role.DRIVER) {
      const driverId = await this.resolveDriverId(socket);
      if (order.driverId !== driverId) {
        throw new ConflictException('Driver can only view their assigned order');
      }
    }
  }
 
  private pushTypeForStatus(status: OrderStatus) {
    switch (status) {
      case OrderStatus.DRIVER_ARRIVED:
        return 'DRIVER_ARRIVED' as const;
      case OrderStatus.IN_PROGRESS:
        return 'ORDER_STARTED' as const;
      case OrderStatus.COMPLETED:
        return 'ORDER_COMPLETED' as const;
      case OrderStatus.CANCELED:
        return 'ORDER_CANCELED' as const;
      default:
        return null;
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