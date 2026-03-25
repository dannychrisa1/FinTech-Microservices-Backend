import { LoginDto } from '@app/common/dto/auth/login.dto';
import { RegisterDto } from '@app/common/dto/auth/register.dto';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { TokenService } from './jwt.service';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
    private readonly tokenService:TokenService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() registerDto: RegisterDto) {
    const result = await lastValueFrom(
      this.authClient.send('register', registerDto),
    );
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await lastValueFrom(this.authClient.send('login', loginDto));
    //add JWT TOKEN
    const token = this.tokenService.sign({
      accountNumber: result.data.accountNumber,
      name: result.data.name,
      email: result.data.email || '', //optional of emial is missing
    });
    return {
      ...result,
      token,
    };
  }
}
