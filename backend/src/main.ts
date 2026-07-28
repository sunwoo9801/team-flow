import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const isProd = process.env.NODE_ENV === 'production';
  app.enableCors({
    // 개발 환경에서는 Vite가 포트 충돌 시 3001, 3002...로 자동 전환하는 경우가 잦아
    // localhost의 어떤 포트든 허용한다. 프로덕션에서는 FRONTEND_URL만 정확히 허용.
    origin: isProd
      ? (process.env.FRONTEND_URL ?? 'http://localhost:3000')
      : /^http:\/\/localhost:\d+$/,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🔌 WebSocket namespace: /boards`);
}

bootstrap();
