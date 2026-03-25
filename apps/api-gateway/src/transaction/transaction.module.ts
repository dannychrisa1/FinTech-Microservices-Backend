import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
// import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports:[
    ClientsModule.register([
      {
        name: 'ACCOUNT_SERVICE',
        transport: Transport.TCP,
        options: { port: 3002 },
      },
      {
        name: 'TRANSACTION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.TRANSACTION_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.ACCOUNT_SERVICE_PORT) || 3003, // This should match your transaction microservice port
        },
      },
    ]),
  ],
  providers: [TransactionService],
  controllers: [TransactionController]
})
export class TransactionModule {}
