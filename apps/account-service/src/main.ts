import { NestFactory } from '@nestjs/core';
import { AccountServiceModule } from './account-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const host = process.env.HOST || '0.0.0.0';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AccountServiceModule,
    {
      transport:Transport.TCP,
      options:{
        host:host,
        port:3002,
      },
    });
  await app.listen();
}
bootstrap();
