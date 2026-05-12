import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RedisIoAdapter } from './modules/realtime/adapters/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const corsOrigin = config.getOrThrow<string>('CORS_ORIGIN');

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const redisIoAdapter = new RedisIoAdapter(config);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Taxi API')
    .setDescription('Backend API foundation for Taxi App')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(config.getOrThrow<number>('PORT'));
}

void bootstrap();
