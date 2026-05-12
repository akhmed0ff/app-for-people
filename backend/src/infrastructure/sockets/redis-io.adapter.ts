import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Server, ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly config: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server: Server = super.createIOServer(port, {
      ...options,
      pingInterval: 25000,
      pingTimeout: 20000,
      transports: ['websocket', 'polling'],
    });

    const redisUrl = this.config.getOrThrow<string>('REDIS_URL');
    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();
    server.adapter(createAdapter(pubClient, subClient));

    return server;
  }
}
