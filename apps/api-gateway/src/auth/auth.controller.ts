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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResendOtpDto } from '@app/common/dto/auth/resend-otp.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
    private readonly tokenService: TokenService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account and sends OTP to email',
  })
  @ApiResponse({
    status: 200,
    description: 'User registered successfully. OTP sent to email',
  })
  @ApiResponse({
    status: 400,
    description: 'Email already exists or invalid data',
  })
  async register(@Body() registerDto: RegisterDto) {
    const result = await lastValueFrom(
      this.authClient.send('register', registerDto),
    );
    return result;
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email with OTP',
    description:
      'Verifies user email using the 6-digit OTP code sent to their email',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully. Redirect to passcode setup.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP code',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already verified',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const result = await lastValueFrom(
      this.authClient.send('verify-otp', verifyOtpDto),
    );
    return result;
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend OTP code',
    description: 'Resends a new 6-digit OTP code to the user email',
  })
  @ApiResponse({
    status: 200,
    description: 'New OTP sent to email',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already verified',
  })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    const result = await lastValueFrom(
      this.authClient.send('resend-otp', resendOtpDto),
    );
    return result;
  }

  @Post('setup-passcode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Setup 6-digit passcode',
    description: 'Creates a 6-digit passcode for quick login access',
  })
  @ApiResponse({
    status: 200,
    description: 'Passcode set successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid passcode format (must be 6 digits)',
  })
  @ApiResponse({
    status: 403,
    description: 'Email not verified',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Passcode already set',
  })
  async setupPasscode(@Body() setupPasscodeDto: SetupPasscodeDto) {
    const result = await lastValueFrom(
      this.authClient.send('setup-passcode', setupPasscodeDto),
    );
    return result;
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Authenticates user and returns JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns JWT token.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: 403,
    description: 'Email not verified',
  })
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
  @ApiOperation({
    summary: 'Login with passcode',
    description: 'Authenticates user using 6-digit passcode for quick access',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns JWT token.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid passcode',
  })
  @ApiResponse({
    status: 403,
    description: 'Email not verified',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'No passcode set. Please login with password first.',
  })
  @ApiResponse({
    status: 423,
    description: 'Account locked due to too many failed attempts',
  })
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
  @ApiOperation({
    summary: 'Update passcode',
    description: 'Updates existing passcode with a new 6-digit passcode',
  })
  @ApiResponse({
    status: 200,
    description: 'Passcode updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid new passcode format',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid current passcode',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'No passcode set',
  })
  async updatePasscode(@Body() updatePasscodeDto: UpdatePasscodeDto) {
    const result = await lastValueFrom(
      this.authClient.send('update-passcode', updatePasscodeDto),
    );
    return result;
  }

  @Post('disable-passcode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disable passcode',
    description: 'Disables/removes the passcode for the user account',
  })
  @ApiResponse({
    status: 200,
    description: 'Passcode disabled successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid passcode',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'No passcode set',
  })
  async disablePasscode(@Body() disablePasscodeDto: DisablePasscodeDto) {
    const result = await lastValueFrom(
      this.authClient.send('disable-passcode', disablePasscodeDto),
    );
    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
    @ApiOperation({
    summary: 'Forgot password',
    description: 'Sends a password reset code to user email',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset code sent to email',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await lastValueFrom(
      this.authClient.send('forgot-password', forgotPasswordDto),
    );
    return result;
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
   @ApiOperation({
    summary: 'Reset password',
    description: 'Resets user password using the reset code sent to email',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Reset code expired',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid reset code',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await lastValueFrom(
      this.authClient.send('reset-password', resetPasswordDto),
    );
    return result;
  }
}
