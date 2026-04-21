import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from 'libs/common/redis/redis.module';
import { QueueService } from './queue.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true,
      envFilePath: '.env',
    }),
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, QueueService],
})
export class AuthServiceModule {}
