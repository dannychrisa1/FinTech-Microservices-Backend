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
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { TokenService } from './jwt.service';
import { VerifyOtpDto } from '@app/common/dto/auth/verify-otp.dto';
import { SetupPasscodeDto } from '@app/common/dto/auth/setup-passcode.dto';
import { LoginWithPasscodeDto } from '@app/common/dto/auth/login-passcode.dto';
import { UpdatePasscodeDto } from '@app/common/dto/auth/update-passcode.dto';
import { DisablePasscodeDto } from '@app/common/dto/auth/disable-passcode.dto';
import { ForgotPasswordDto } from '@app/common/dto/auth/forgot-password.dto';
import { ResetPasswordDto } from '@app/common/dto/auth/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
    private readonly tokenService: TokenService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() registerDto: RegisterDto) {
    const result = await lastValueFrom(
      this.authClient.send('register', registerDto),
    );
    return result;
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const result = await lastValueFrom(
      this.authClient.send('verify-otp', verifyOtpDto),
    );
    return result;
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() body: { email: string }) {
    const result = await lastValueFrom(
      this.authClient.send('resend-otp', body),
    );
    return result;
  }

  @Post('setup-passcode')
  @HttpCode(HttpStatus.OK)
  async setupPasscode(@Body() setupPasscodeDto: SetupPasscodeDto) {
    const result = await lastValueFrom(
      this.authClient.send('setup-passcode', setupPasscodeDto),
    );
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await lastValueFrom(
      this.authClient.send('login-with-password', loginDto),
    );

    // Generate JWT token
    const token = this.tokenService.sign({
      accountNumber: result.data.accountNumber,
      name: result.data.name,
      email: result.data.email,
    });

    return {
      ...result,
      token,
    };
  }

  @Post('login-with-passcode')
  @HttpCode(HttpStatus.OK)
  async loginWithPasscode(@Body() loginWithPasscodeDto: LoginWithPasscodeDto) {
    const result = await lastValueFrom(
      this.authClient.send('login-with-passcode', loginWithPasscodeDto),
    );

    // Generate JWT token
    const token = this.tokenService.sign({
      accountNumber: result.data.accountNumber,
      name: result.data.name,
      email: result.data.email,
    });

    return {
      ...result,
      token,
    };
  }

  @Post('update-passcode')
  @HttpCode(HttpStatus.OK)
  async updatePasscode(@Body() updatePasscodeDto: UpdatePasscodeDto) {
    const result = await lastValueFrom(
      this.authClient.send('update-passcode', updatePasscodeDto),
    );
    return result;
  }

  @Post('disable-passcode')
  @HttpCode(HttpStatus.OK)
  async disablePasscode(@Body() disablePasscodeDto: DisablePasscodeDto) {
    const result = await lastValueFrom(
      this.authClient.send('disable-passcode', disablePasscodeDto),
    );
    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await lastValueFrom(
      this.authClient.send('forgot-password', forgotPasswordDto),
    );
    return result;
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await lastValueFrom(
      this.authClient.send('reset-password', resetPasswordDto),
    );
    return result;
  }
}
