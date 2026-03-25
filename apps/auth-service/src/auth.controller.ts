import { Body, Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('register')
  register(@Payload() payload:{ name: string; email:string; password:string}){
    console.log('Incoming register request:', payload.name);

    return this.authService.register(payload.name, payload.email, payload.password);
  }

  @MessagePattern('login')
  login(@Payload() payload:{ email: string; password:string;}){
    console.log('Incoming login request:', payload.email);
    return this.authService.login(payload.email, payload.password);
  }
}
