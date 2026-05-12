import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private readonly config: ConfigService) {}

  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.config.getOrThrow<string>('NODE_ENV'),
    };
  }
}
