import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  check() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  async readiness() {
    await this.prisma.$queryRaw`SELECT 1`;
    await this.redis.ping();

    return {
      status: 'ready',
      services: {
        database: 'ok',
        redis: 'ok',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
