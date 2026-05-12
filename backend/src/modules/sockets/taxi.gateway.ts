import { UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { Role } from '../../domain/auth/role.enum';
import { JwtUser } from '../auth/auth.types';
import { DispatchOrderDto, OrderActionDto, OrderStatusDto } from './dto/socket-order.dto';
import { SocketLocationDto } from './dto/socket-location.dto';
import {
  AuthenticatedSocketData,
  ClientToServerEvents,
  EtaPayload,
  NearestDriverPayload,
  Rooms,
  ServerToClientEvents,
  SocketEvent,
} from './socket-events';
import { TaxiRealtimeService } from './taxi-realtime.service';

type AuthedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: AuthenticatedSocketData;
};

@WebSocketGateway({
  namespace: 'taxi',
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') ?? [],
    credentials: true,
  },
})
@UsePipes(
  new ValidationPipe({
    forbidNonWhitelisted: true,
    transform: true,
    whitelist: true,
  }),
)
export class TaxiGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    private readonly realtime: TaxiRealtimeService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const user = await this.authenticate(client);
      await this.realtime.attachClient(client, user);
      client.emit('connected', {
        socketId: client.id,
        userId: user.sub,
        role: user.role,
        heartbeatIntervalMs: 25000,
      });
    } catch {
      client.emit(SocketEvent.Error, { message: 'Unauthorized socket connection' });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthedSocket) {
    await this.realtime.detachClient(client);
  }

  @SubscribeMessage(SocketEvent.Heartbeat)
  async heartbeat(@ConnectedSocket() socket: AuthedSocket) {
    const ack = await this.realtime.heartbeat(socket);
    socket.emit(SocketEvent.HeartbeatAck, ack);
    return ack;
  }

  @SubscribeMessage(SocketEvent.DriverOnline)
  async driverOnline(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() payload?: SocketLocationDto,
  ) {
    this.ensureRole(socket, [Role.DRIVER, Role.ADMIN]);
    return this.realtime.setDriverOnline(socket, this.server, payload);
  }

  @SubscribeMessage(SocketEvent.DriverOffline)
  async driverOffline(@ConnectedSocket() socket: AuthedSocket) {
    this.ensureRole(socket, [Role.DRIVER, Role.ADMIN]);
    if (!socket.data.driverId) {
      throw new WsException('Driver profile not found');
    }
    return this.realtime.setDriverOffline(socket.data.driverId);
  }

  @SubscribeMessage(SocketEvent.DriverLocationUpdate)
  async updateDriverLocation(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() payload: SocketLocationDto,
  ) {
    this.ensureRole(socket, [Role.DRIVER, Role.ADMIN]);
    return this.realtime.updateDriverLocation(socket, this.server, payload);
  }

  @SubscribeMessage(SocketEvent.DriverNearestSearch)
  async findNearestDrivers(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() payload: NearestDriverPayload,
  ) {
    this.ensureRole(socket, [Role.ADMIN, Role.PASSENGER]);
    const drivers = await this.realtime.findNearestDrivers(payload);
    socket.emit(SocketEvent.DriverNearestFound, drivers);
    return drivers;
  }

  @SubscribeMessage(SocketEvent.OrderDispatch)
  async dispatchOrder(@ConnectedSocket() socket: AuthedSocket, @MessageBody() payload: DispatchOrderDto) {
    this.ensureRole(socket, [Role.ADMIN, Role.PASSENGER]);
    const result = await this.realtime.dispatchOrder(this.server, payload);
    socket.join(Rooms.order(payload.orderId));
    return result;
  }

  @SubscribeMessage(SocketEvent.OrderAccept)
  async acceptOrder(@ConnectedSocket() socket: AuthedSocket, @MessageBody() payload: OrderActionDto) {
    this.ensureRole(socket, [Role.DRIVER, Role.ADMIN]);
    return this.realtime.acceptOrder(socket, this.server, payload);
  }

  @SubscribeMessage(SocketEvent.OrderCancel)
  async cancelOrder(@ConnectedSocket() socket: AuthedSocket, @MessageBody() payload: OrderActionDto) {
    this.ensureRole(socket, [Role.ADMIN, Role.PASSENGER, Role.DRIVER]);
    return this.realtime.cancelOrder(socket, this.server, payload);
  }

  @SubscribeMessage(SocketEvent.OrderStatusUpdate)
  async updateOrderStatus(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() payload: OrderStatusDto,
  ) {
    this.ensureRole(socket, [Role.DRIVER, Role.ADMIN]);
    return this.realtime.updateOrderStatus(socket, this.server, payload);
  }

  @SubscribeMessage(SocketEvent.EtaRequest)
  eta(@ConnectedSocket() socket: AuthedSocket, @MessageBody() payload: EtaPayload) {
    this.ensureRole(socket, [Role.ADMIN, Role.PASSENGER, Role.DRIVER]);
    const eta = this.realtime.calculateEta(payload);
    this.server.to(Rooms.order(payload.orderId)).emit(SocketEvent.EtaUpdated, eta);
    return eta;
  }

  private async authenticate(socket: Socket): Promise<JwtUser> {
    const token = this.extractToken(socket);
    if (!token) {
      throw new WsException('Missing socket token');
    }

    return this.jwt.verifyAsync<JwtUser>(token, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  private extractToken(socket: Socket) {
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length);
    }
    const authToken = socket.handshake.auth?.token;
    if (typeof authToken === 'string') {
      return authToken;
    }
    return undefined;
  }

  private ensureRole(socket: AuthedSocket, roles: Role[]) {
    if (!roles.includes(socket.data.role)) {
      throw new WsException('Forbidden socket event');
    }
  }
}
