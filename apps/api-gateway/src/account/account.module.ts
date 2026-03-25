import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'TRANSACTION_SERVICE',
        transport: Transport.TCP,
        options: {
          port: 3003,
        },
      },
      {
        name: 'ACCOUNT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ACCOUNT_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.ACCOUNT_SERVICE_PORT) || 3002,
        },
      },
    ]),
    AuthModule,
  ],
  providers: [AccountService],
  controllers: [AccountController],
})
export class AccountModule {}
