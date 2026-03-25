import { NestFactory } from '@nestjs/core';
import { PaymentServiceModule } from './payment-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const host = process.env.HOST || '0.0.0.0';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: host,
        port: 3004,
      },
    },
  );

  await app.listen();
  console.log('✅ Payment microservice listening on localhost:3004');
}

bootstrap();
