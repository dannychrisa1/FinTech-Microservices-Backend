import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './jwt.service';

@Module({
  imports:[
    JwtModule.register({
      secret:process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h'},
    }),
    ClientsModule.register([
      {
        name:'AUTH_SERVICE',
        transport:Transport.TCP,
        options:{
          host: process.env.AUTH_SERVICE_HOST || 'localhost',
          port:parseInt(process.env.AUTH_SERVICE_PORT) || 3001,
        },
      },
    ]),
  ],
  providers: [AuthService, TokenService],
  controllers: [AuthController],
  exports:[ClientsModule, TokenService],
})
export class AuthModule {}
