import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { QueueService } from './queue.service';
import { ApiResponse } from '@app/common/dto/api-response.dto';
import { RpcCustomException } from '@app/common';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();
  constructor(private queueService: QueueService) {}

  //Register
  async register(name: string, email: string, password: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new RpcCustomException('User with this email already exists', 409);
    }

    //Hash the Pssword
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a random account number

    const accountNumber = Math.floor(
      1000000000 + Math.random() * 9000000000,
    ).toString();

    // Generate OTP
    const otpCode = randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); //10 minutes

    //Save user in DB

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        accountNumber,
        otpCode,
        otpExpiresAt,
        isEmailVerified: false,
        isPasscodeSet: false,
        passcodeAttempts: 0,
        passcodeLockedUntil: null,
        account: {
          create: { balance: 0 },
        },
      },
      include: { account: true },
    });

    //Send OTP email
    await this.queueService.sendOtpEmail(email, name, otpCode);

    return ApiResponse.success(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        accountNumber: user.accountNumber,
        requiresVerification: true,
      },
      'User registered succesfully.Please verify your email with the OTP sent.',
    );
  }

  //Verify OTP
  async verifyOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { account: true },
    });

    if (!user) {
      throw new RpcCustomException('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new RpcCustomException('Email already verified', 409);
    }

    if (user.otpCode !== otp) {
      throw new RpcCustomException('Invalid OTP code', 400);
    }

    if (user.otpExpiresAt < new Date()) {
      throw new RpcCustomException('OTP has expired. Please request a new one', 400);
    }

    //update user as verified

    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    //Send Welcome Email with Account Number

    await this.queueService.sendWelcomeEmail(
      email,
      user.name,
      user.accountNumber,
    );

    return ApiResponse.success(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        accountNumber: updatedUser.accountNumber,
        requiresPasscodeSetup: true,
        verifiedAt: new Date().toISOString(),
      },
      'Email verified successfully! Please setup your passcode to continue.',
    );
  }

  //Resend OTP

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcCustomException('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new RpcCustomException('Email already verified', 409);
    }

    //Generate new OTP
    const otpCode = randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { email },
      data: {
        otpCode,
        otpExpiresAt,
      },
    });

    //Send new OTP email

    await this.queueService.sendOtpEmail(email, user.name, otpCode);

    return ApiResponse.success(
      {
        expiresInMinutes: 10,
      },
      'New OTP sent to your email',
    );
  }

  //Setup Passcode

  async setupPasscode(email: string, passcode: string) {
    //Validate passcode(6 digits)
    if (!/^\d{6}$/.test(passcode)) {
      throw new RpcCustomException('Passcode must be 6 digits', 400);
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcCustomException('User not found', 404);
    }

    if (!user.isEmailVerified) {
      throw new RpcCustomException('Please verify your email first', 403);
    }

    if (user.isPasscodeSet) {
      throw new RpcCustomException('Passcode already set', 409);
    }

    const hashedPasscode = await bcrypt.hash(passcode, 10);

    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: {
        passcode: hashedPasscode,
        isPasscodeSet: true,
        passcodeSetAt: new Date(),
      },
    });

    return ApiResponse.success(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        accountNumber: updatedUser.accountNumber,
        isPasscodeSet: updatedUser.isPasscodeSet,
        passcodeSetAt: updatedUser.passcodeSetAt?.toISOString(),
      },
      'Passcode set successfully',
    );
  }

  //Login With Password

  async loginWithPassword(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { account: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new RpcCustomException('Invalid email or password', 401);
    }

    if (!user.isEmailVerified) {
      throw new RpcCustomException('Please verify your email first', 403);
    }

    return ApiResponse.success(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        accountNumber: user.accountNumber,
        balance: user.account.balance,
        isPasscodeSet: user.isPasscodeSet,
        lastLoginAt: new Date().toISOString(),
      },
      'Login successful',
    );
  }

  //Login with Passcode

  async loginWithPasscode(email: string, passcode: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { account: true },
    });

    if (!user) {
      throw new RpcCustomException('User not found', 404);
    }

    if (!user.isEmailVerified) {
      throw new RpcCustomException('Please verify your email first', 403);
    }

    if (!user.isPasscodeSet) {
      throw new RpcCustomException(
        'No passcode set. Please login with password first.',
        409
      );
    }

    // Check if account is locked
    if (user.passcodeLockedUntil && user.passcodeLockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.passcodeLockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new RpcCustomException(
        `Account locked. Try again after ${remainingMinutes} minutes`,
        423
      );
    }

    const isPasscodeValid = await bcrypt.compare(passcode, user.passcode);

    if (!isPasscodeValid) {
      // Increment failed attempts
      const newAttempts = (user.passcodeAttempts || 0) + 1;
      let lockedUntil = null;

      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }

      await this.prisma.user.update({
        where: { email },
        data: {
          passcodeAttempts: newAttempts,
          passcodeLockedUntil: lockedUntil,
        },
      });

      const remainingAttempts = 5 - newAttempts;
      throw new RpcCustomException(
        `Invalid passcode. ${remainingAttempts} attempts remaining`,
        401
      );
    }

    // Reset attempts on successful login
    await this.prisma.user.update({
      where: { email },
      data: {
        passcodeAttempts: 0,
        passcodeLockedUntil: null,
      },
    });

    return ApiResponse.success(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        accountNumber: user.accountNumber,
        balance: user.account.balance,
        isPasscodeSet: user.isPasscodeSet,
        lastLoginAt: new Date().toISOString(),
      },
      'Login successful',
    );
  }

  //Update Passcode

  async updatePasscode(
    email: string,
    oldPasscode: string,
    newPasscode: string,
  ) {
    // Validate new passcode (6 digits)
    if (!/^\d{6}$/.test(newPasscode)) {
      throw new RpcCustomException('New passcode must be 6 digits', 400);
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcCustomException('User not found', 404);
    }

    if (!user.isPasscodeSet) {
      throw new RpcCustomException('No passcode set', 409);
    }

    const isPasscodeValid = await bcrypt.compare(oldPasscode, user.passcode);

    if (!isPasscodeValid) {
      throw new RpcCustomException('Invalid current passcode', 401);
    }

    const hashedNewPasscode = await bcrypt.hash(newPasscode, 10);

    await this.prisma.user.update({
      where: { email },
      data: {
        passcode: hashedNewPasscode,
        passcodeSetAt: new Date(),
      },
    });

    return ApiResponse.success(
      {
        isPasscodeSet: true,
        updatedAt: new Date().toISOString(),
      },
      'Passcode updated successfully',
    );
  }

  //Disable Passcode

  async disablePasscode(email: string, passcode: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcCustomException('User not found', 404);
    }

    if (!user.isPasscodeSet) {
      throw new RpcCustomException('No passcode set', 409);
    }

    const isPasscodeValid = await bcrypt.compare(passcode, user.passcode);

    if (!isPasscodeValid) {
      throw new RpcCustomException('Invalid passcode', 401);
    }

    await this.prisma.user.update({
      where: { email },
      data: {
        passcode: null,
        isPasscodeSet: false,
        passcodeSetAt: null,
      },
    });

    return ApiResponse.success(
      {
        isPasscodeSet: false,
        disabledAt: new Date().toISOString(),
      },
      'Passcode disabled successfully'
    );
  }

  //Forgot Password

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcCustomException('User not found', 404);
    }

    // Generate reset code
    const resetCode = randomInt(100000, 999999).toString();
    const resetExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { email },
      data: {
        otpCode: resetCode,
        otpExpiresAt: resetExpiresAt,
      },
    });

    // Send reset code email
    await this.queueService.sendResetPasswordEmail(email, user.name, resetCode);

    return ApiResponse.success(
      {
        expiresInMinutes: 10,
      },
      'Password reset code sent to your email',
    );
  }

  //Reset Password

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcCustomException('User not found', 404);
    }

    if (user.otpCode !== code) {
      throw new RpcCustomException('Invalid reset code', 401);
    }

    if (user.otpExpiresAt < new Date()) {
      throw new RpcCustomException('Reset code expired', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return ApiResponse.success(
      {
        email: user.email,
        resetAt: new Date().toISOString(),
      },
      'Password reset successful'
    );
  }
}
