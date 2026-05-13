import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UnregisterPushTokenDto } from './dto/unregister-push-token.dto';
import { ExpoPushService } from './expo-push.service';
import { OrderPushPayload, PushMessage } from './push.types';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expoPush: ExpoPushService,
  ) {}

  register(userId: string, dto: RegisterPushTokenDto) {
    return this.prisma.pushToken.upsert({
      where: { token: dto.token },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
        deviceId: dto.deviceId,
      },
      update: {
        userId,
        platform: dto.platform,
        deviceId: dto.deviceId,
        isActive: true,
      },
    });
  }

  async unregister(userId: string, dto: UnregisterPushTokenDto) {
    await this.prisma.pushToken.updateMany({
      where: { userId, token: dto.token },
      data: { isActive: false },
    });
    return { token: dto.token, isActive: false };
  }

  async notifyUser(userId: string, payload: OrderPushPayload) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId, isActive: true },
      select: { token: true },
    });

    await this.send(
      tokens.map(({ token }) => this.toMessage(token, payload)),
    );
  }

  async notifyDrivers(driverIds: string[], payload: OrderPushPayload) {
    if (!driverIds.length) {
      return;
    }

    const tokens = await this.prisma.pushToken.findMany({
      where: {
        isActive: true,
        user: { driver: { is: { id: { in: driverIds } } } },
      },
      select: { token: true },
    });

    await this.send(
      tokens.map(({ token }) => this.toMessage(token, payload)),
    );
  }

  async notifyPassenger(passengerId: string, payload: OrderPushPayload) {
    const passenger = await this.prisma.passenger.findUnique({
      where: { id: passengerId },
      select: { userId: true },
    });

    if (passenger) {
      await this.notifyUser(passenger.userId, payload);
    }
  }

  async notifyDriver(driverId: string, payload: OrderPushPayload) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { userId: true },
    });

    if (driver) {
      await this.notifyUser(driver.userId, payload);
    }
  }

  private async send(messages: PushMessage[]) {
    try {
      const result = await this.expoPush.send(messages);

      if (result.invalidTokens.length) {
        await this.prisma.pushToken.updateMany({
          where: { token: { in: result.invalidTokens } },
          data: { isActive: false },
        });
      }

      for (const failed of result.failed) {
        this.logger.warn(`Push failed for token ${failed.token}: ${failed.message}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown push error';
      this.logger.warn(`Push notification skipped: ${message}`);
    }
  }

  private toMessage(token: string, payload: OrderPushPayload): PushMessage {
    const copy = this.copyFor(payload);
    return {
      to: token,
      title: copy.title,
      body: copy.body,
      data: payload,
      sound: 'default',
      channelId: payload.role === 'DRIVER' ? 'driver-orders' : 'orders',
    };
  }

  private copyFor(payload: OrderPushPayload) {
    switch (payload.type) {
      case 'NEW_ORDER':
        return { title: 'New nearby order', body: 'A passenger is waiting nearby.' };
      case 'ORDER_ACCEPTED':
        return { title: 'Driver assigned', body: 'Your driver accepted the order.' };
      case 'DRIVER_ARRIVED':
        return { title: 'Driver arrived', body: 'Your driver is at the pickup point.' };
      case 'ORDER_STARTED':
        return { title: 'Trip started', body: 'Your trip is now in progress.' };
      case 'ORDER_COMPLETED':
        return { title: 'Trip completed', body: 'Thanks for riding with us.' };
      case 'ORDER_CANCELED':
        return { title: 'Order canceled', body: 'The order has been canceled.' };
      default:
        return { title: 'Taxi update', body: 'Your order status changed.' };
    }
  }
}
