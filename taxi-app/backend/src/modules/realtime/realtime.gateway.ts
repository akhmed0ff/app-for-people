import { ForbiddenException, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { DriverStatus, OrderStatus, UserRole } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser, JwtPayload } from '../auth/auth.types';
import { DriversService } from '../drivers/drivers.service';
import { OrderRoomDto } from './dto/order-room.dto';
import { SocketLocationDto } from './dto/socket-location.dto';
import { validateSocketPayload } from './socket-validation';
import {
  CLIENT_SOCKET_EVENTS,
  SOCKET_ROOMS,
  SocketUserData,
} from './realtime.events';
import { RealtimeService } from './realtime.service';

type AuthenticatedSocket = Socket & {
  data: SocketUserData;
};

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly driversService: DriversService,
    private readonly realtimeService: RealtimeService,
  ) {}

  afterInit(server: Server): void {
    this.realtimeService.setServer(server);
    server.use(async (socket, next) => {
      try {
        const token = this.extractToken(socket);
        const data = await this.authenticate(token);
        socket.data = data;
        next();
      } catch (error) {
        next(error instanceof Error ? error : new UnauthorizedException('Invalid socket token'));
      }
    });
  }

  async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    await socket.join(SOCKET_ROOMS.user(socket.data.userId));

    if (socket.data.role === UserRole.ADMIN) {
      await socket.join(SOCKET_ROOMS.admins);
    }

    if (socket.data.passengerId) {
      await socket.join(SOCKET_ROOMS.passenger(socket.data.passengerId));
    }

    if (socket.data.driverId) {
      await socket.join(SOCKET_ROOMS.driver(socket.data.driverId));
    }

    this.logger.log(`Socket connected ${socket.id} user=${socket.data.userId} role=${socket.data.role}`);
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    const userId = socket.data?.userId ?? 'anonymous';
    this.logger.log(`Socket disconnected ${socket.id} user=${userId}`);
  }

  @SubscribeMessage(CLIENT_SOCKET_EVENTS.DRIVER_ONLINE)
  async driverOnline(@ConnectedSocket() socket: AuthenticatedSocket) {
    this.assertRole(socket, UserRole.DRIVER);
    const driver = await this.driversService.updateStatus(this.toUser(socket), {
      status: DriverStatus.ONLINE,
    });
    await socket.join(SOCKET_ROOMS.driversOnline);

    return driver;
  }

  @SubscribeMessage(CLIENT_SOCKET_EVENTS.DRIVER_OFFLINE)
  async driverOffline(@ConnectedSocket() socket: AuthenticatedSocket) {
    this.assertRole(socket, UserRole.DRIVER);
    const driver = await this.driversService.updateStatus(this.toUser(socket), {
      status: DriverStatus.OFFLINE,
    });
    await socket.leave(SOCKET_ROOMS.driversOnline);

    return driver;
  }

  @SubscribeMessage(CLIENT_SOCKET_EVENTS.DRIVER_LOCATION_UPDATE)
  async updateDriverLocation(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() payload: unknown,
  ) {
    this.assertRole(socket, UserRole.DRIVER);
    const dto = await validateSocketPayload(SocketLocationDto, payload);

    return this.driversService.updateLocation(this.toUser(socket), dto);
  }

  @SubscribeMessage(CLIENT_SOCKET_EVENTS.ORDER_JOIN)
  async joinOrder(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() payload: unknown) {
    const dto = await validateSocketPayload(OrderRoomDto, payload);
    await this.assertCanJoinOrder(socket, dto.orderId);
    await socket.join(SOCKET_ROOMS.order(dto.orderId));

    return { joined: true, orderId: dto.orderId };
  }

  @SubscribeMessage(CLIENT_SOCKET_EVENTS.ORDER_LEAVE)
  async leaveOrder(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() payload: unknown) {
    const dto = await validateSocketPayload(OrderRoomDto, payload);
    await socket.leave(SOCKET_ROOMS.order(dto.orderId));

    return { left: true, orderId: dto.orderId };
  }

  private extractToken(socket: Socket): string {
    const token = socket.handshake.auth?.token;

    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('Socket token is required');
    }

    return token;
  }

  private async authenticate(token: string): Promise<SocketUserData> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        passenger: true,
        driver: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid socket token');
    }

    return {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      passengerId: user.passenger?.id,
      driverId: user.driver?.id,
    };
  }

  private assertRole(socket: AuthenticatedSocket, role: UserRole): void {
    if (socket.data.role !== role) {
      throw new ForbiddenException(`Socket event requires ${role} role`);
    }
  }

  private async assertCanJoinOrder(socket: AuthenticatedSocket, orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        passengerId: true,
        driverId: true,
      },
    });

    if (!order) {
      throw new ForbiddenException('Order is not available for this socket');
    }

    if (socket.data.role === UserRole.ADMIN) {
      return;
    }

    if (socket.data.passengerId && socket.data.passengerId === order.passengerId) {
      return;
    }

    if (socket.data.driverId && socket.data.driverId === order.driverId) {
      return;
    }

    throw new ForbiddenException('Order is not available for this socket');
  }

  private toUser(socket: AuthenticatedSocket): AuthenticatedUser {
    return {
      id: socket.data.userId,
      phone: socket.data.phone,
      name: '',
      role: socket.data.role,
      isActive: true,
    };
  }
}
