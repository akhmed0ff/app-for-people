import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './infrastructure/sockets/redis-io.adapter';
import { AllExceptionsFilter } from './interfaces/http/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.useLogger(app.get(Logger));
  app.useWebSocketAdapter(new RedisIoAdapter(app, config));
  app.use(helmet());
  app.setGlobalPrefix(config.getOrThrow<string>('API_PREFIX'));
  app.enableVersioning({ type: VersioningType.URI });

  app.enableCors({
    origin: config.get<string[]>('CORS_ORIGINS'),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(app.get(Logger)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Taxi Platform API')
    .setDescription('Backend API for admin, passenger, and driver applications.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(config.getOrThrow<number>('PORT'));
}

void bootstrap();
