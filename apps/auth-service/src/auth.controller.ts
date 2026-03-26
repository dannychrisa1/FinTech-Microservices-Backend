import { Body, Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('register')
  register(
    @Payload() payload: { name: string; email: string; password: string },
  ) {
    console.log('Incoming register request:', payload.name);

    return this.authService.register(
      payload.name,
      payload.email,
      payload.password,
    );
  }

  @MessagePattern('verify-otp')
  verifyOtp(@Payload() payload: { email: string; otp: string }) {
    console.log('Incoming OTP verification:', payload.email);
    return this.authService.verifyOtp(payload.email, payload.otp);
  }

  @MessagePattern('resend-otp')
  resendOtp(@Payload() payload: { email: string }) {
    console.log('Incoming resend OTP:', payload.email);
    return this.authService.resendOtp(payload.email);
  }

  @MessagePattern('setup-passcode')
  setupPasscode(@Payload() payload: { email: string; passcode: string }) {
    console.log('Incoming passcode setup:', payload.email);
    return this.authService.setupPasscode(payload.email, payload.passcode);
  }

  @MessagePattern('login-with-password')
  loginWithPassword(@Payload() payload: { email: string; password: string }) {
    console.log('Incoming login with password:', payload.email);
    return this.authService.loginWithPassword(payload.email, payload.password);
  }

  @MessagePattern('login-with-passcode')
  loginWithPasscode(@Payload() payload: { email: string; passcode: string }) {
    console.log('Incoming login with passcode:', payload.email);
    return this.authService.loginWithPasscode(payload.email, payload.passcode);
  }

  @MessagePattern('update-passcode')
  updatePasscode(
    @Payload()
    payload: {
      email: string;
      oldPasscode: string;
      newPasscode: string;
    },
  ) {
    console.log('Incoming passcode update:', payload.email);
    return this.authService.updatePasscode(
      payload.email,
      payload.oldPasscode,
      payload.newPasscode,
    );
  }

  @MessagePattern('disable-passcode')
  disablePasscode(@Payload() payload: { email: string; passcode: string }) {
    console.log('Incoming passcode disable:', payload.email);
    return this.authService.disablePasscode(payload.email, payload.passcode);
  }

  @MessagePattern('forgot-password')
  forgotPassword(@Payload() payload: { email: string }) {
    console.log('Incoming forgot password:', payload.email);
    return this.authService.forgotPassword(payload.email);
  }

  @MessagePattern('reset-password')
  resetPassword(
    @Payload() payload: { email: string; code: string; newPassword: string },
  ) {
    console.log('Incoming reset password:', payload.email);
    return this.authService.resetPassword(
      payload.email,
      payload.code,
      payload.newPassword,
    );
  }
}
