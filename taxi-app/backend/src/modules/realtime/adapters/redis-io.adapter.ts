import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async connectToRedis(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.log('REDIS_URL is empty, Socket.IO Redis adapter disabled');
      return;
    }

    try {
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);
      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log('Socket.IO Redis adapter connected');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Redis adapter error';
      this.logger.warn(`Socket.IO Redis adapter disabled: ${message}`);
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }
}
