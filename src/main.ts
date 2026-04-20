import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

class BootstrapModule {}

export const createApp = async (): Promise<NestFastifyApplication> => {
  const app = await NestFactory.create<NestFastifyApplication>(
    BootstrapModule,
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
  await app.listen({ host: '0.0.0.0', port: 3000 });
};

if (process.env.NODE_ENV !== 'test') {
  void bootstrap();
}
