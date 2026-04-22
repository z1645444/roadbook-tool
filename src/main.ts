import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

export const createApp = async (): Promise<NestFastifyApplication> => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  return app;
};

export const bootstrap = async (): Promise<void> => {
  const app = await createApp();
  const portRaw = process.env.PORT ?? '3333';
  const parsedPort = Number.parseInt(portRaw, 10);
  const port = Number.isFinite(parsedPort) ? parsedPort : 3333;

  await app.listen({ host: '0.0.0.0', port });
};

if (process.env.NODE_ENV !== 'test') {
  void bootstrap();
}
