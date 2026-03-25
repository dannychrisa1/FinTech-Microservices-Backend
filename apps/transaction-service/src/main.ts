import { NestFactory } from '@nestjs/core';
import { TransactionServiceModule } from './transaction-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const host = process.env.HOST || '0.0.0.0';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TransactionServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: host,
        port: 3003,
      },
    },
  );
  await app.listen();
   console.log(`📊 Transaction Service running `);
}
bootstrap();
