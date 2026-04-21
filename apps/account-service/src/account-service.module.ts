import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RedisModule } from 'libs/common/redis/redis.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'TRANSACTION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.TRANSACTION_SERVICE_HOST || 'transaction-service',
          port: parseInt(process.env.TRANSACTION_SERVICE_PORT) || 3003,
        },
      },
    ]),
    RedisModule,
  ],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountServiceModule {}
