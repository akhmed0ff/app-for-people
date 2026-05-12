import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Server } from 'socket.io';
import {
  DriverLocationRealtimePayload,
  DriverStatusRealtimePayload,
  INTERNAL_REALTIME_EVENTS,
  OrderRealtimePayload,
  SERVER_SOCKET_EVENTS,
  SOCKET_ROOMS,
} from './realtime.events';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server?: Server;

  setServer(server: Server): void {
    this.server = server;
  }

  @OnEvent(INTERNAL_REALTIME_EVENTS.ORDER_CREATED)
  emitOrderCreated(payload: OrderRealtimePayload): void {
    this.emitToRooms([SOCKET_ROOMS.driversOnline, SOCKET_ROOMS.admins], SERVER_SOCKET_EVENTS.ORDER_CREATED, payload);
  }

  @OnEvent(INTERNAL_REALTIME_EVENTS.ORDER_ACCEPTED)
  emitOrderAccepted(payload: OrderRealtimePayload): void {
    this.emitOrderEvent(SERVER_SOCKET_EVENTS.ORDER_ACCEPTED, payload);
  }

  @OnEvent(INTERNAL_REALTIME_EVENTS.ORDER_DRIVER_ARRIVED)
  emitDriverArrived(payload: OrderRealtimePayload): void {
    this.emitOrderEvent(SERVER_SOCKET_EVENTS.ORDER_DRIVER_ARRIVED, payload);
  }

  @OnEvent(INTERNAL_REALTIME_EVENTS.ORDER_STARTED)
  emitOrderStarted(payload: OrderRealtimePayload): void {
    this.emitOrderEvent(SERVER_SOCKET_EVENTS.ORDER_STARTED, payload);
  }

  @OnEvent(INTERNAL_REALTIME_EVENTS.ORDER_COMPLETED)
  emitOrderCompleted(payload: OrderRealtimePayload): void {
    this.emitOrderEvent(SERVER_SOCKET_EVENTS.ORDER_COMPLETED, payload);
  }

  @OnEvent(INTERNAL_REALTIME_EVENTS.ORDER_CANCELED)
  emitOrderCanceled(payload: OrderRealtimePayload): void {
    const rooms = [
      SOCKET_ROOMS.passenger(payload.passengerId),
      SOCKET_ROOMS.order(payload.order.id),
      SOCKET_ROOMS.admins,
    ];

    if (payload.driverId) {
      rooms.push(SOCKET_ROOMS.driver(payload.driverId));
    }

    this.emitToRooms(rooms, SERVER_SOCKET_EVENTS.ORDER_CANCELED, payload);
  }

  @OnEvent(INTERNAL_REALTIME_EVENTS.DRIVER_STATUS_UPDATED)
  emitDriverStatusUpdated(payload: DriverStatusRealtimePayload): void {
    this.emitToRooms([SOCKET_ROOMS.admins], SERVER_SOCKET_EVENTS.DRIVER_STATUS_UPDATED, payload);
  }

  @OnEvent(INTERNAL_REALTIME_EVENTS.DRIVER_LOCATION_UPDATED)
  emitDriverLocationUpdated(payload: DriverLocationRealtimePayload): void {
    const rooms = [SOCKET_ROOMS.driver(payload.driverId)];

    if (payload.orderId) {
      rooms.push(SOCKET_ROOMS.order(payload.orderId));
    }

    this.emitToRooms(rooms, SERVER_SOCKET_EVENTS.DRIVER_LOCATION_UPDATED, payload);
  }

  private emitOrderEvent(event: string, payload: OrderRealtimePayload): void {
    this.emitToRooms(
      [
        SOCKET_ROOMS.passenger(payload.passengerId),
        SOCKET_ROOMS.order(payload.order.id),
        SOCKET_ROOMS.admins,
      ],
      event,
      payload,
    );
  }

  private emitToRooms(rooms: string[], event: string, payload: unknown): void {
    if (!this.server) {
      this.logger.debug(`Socket server is not ready, skipped event ${event}`);
      return;
    }

    for (const room of rooms) {
      this.server.to(room).emit(event, payload);
    }
  }
}
