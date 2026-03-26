import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';

import * as bcrypt from 'bcrypt';
import { EmailService } from './email.service';
import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();
  constructor(private emailService: EmailService) {}

  //Register
  async register(name: string, email: string, password: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new RpcException('User with this email already exists');
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
    await this.emailService.sendOtpEmail(email, name, otpCode);

    return {
      message: 'User registered succesfully',
      data: {
        name: user.name,
        email: user.email,
        accountNumber: user.accountNumber,
        requiresVerification: true,
      },
    };
  }

  //Verify OTP
  async verifyOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { account: true },
    });

    if (!user) {
      throw new RpcException('User not found');
    }

    if (user.isEmailVerified) {
      throw new RpcException('Email already verified');
    }

    if (user.otpCode !== otp) {
      throw new RpcException('Invalid OTP code');
    }

    if (user.otpExpiresAt < new Date()) {
      throw new RpcException('OTP has expired. Please request a new one');
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

    await this.emailService.sendPasscodeSetupEmail(
      email,
      user.name,
      user.accountNumber,
    );

    return {
      message:
        'Email verified successfully! Please setup your passcode to continue.',
      data: {
        email: updatedUser.email,
        name: updatedUser.name,
        accountNumber: updatedUser.accountNumber,
        requiresPasscodeSetup: true,
      },
    };
  }

  //Resend OTP

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcException('User not found');
    }

    if (user.isEmailVerified) {
      throw new RpcException('Email already verified');
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

    await this.emailService.sendOtpEmail(email, user.name, otpCode);

    return {
      message: 'New OTP sent to your email',
    };
  }

  //Setup Passcode

  async setupPasscode(email: string, passcode: string) {
    //Validate passcode(6 digits)
    if (!/^\d{6}$/.test(passcode)) {
      throw new RpcException('Passcode must be 6 digits');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcException('User not found');
    }

    if (!user.isEmailVerified) {
      throw new RpcException('Please verify your email first');
    }

    if (user.isPasscodeSet) {
      throw new RpcException('Passcode already set');
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

    return {
      message: 'Passcode set successfully',
      data: {
        email: updatedUser.email,
        name: updatedUser.name,
        accountNumber: updatedUser.accountNumber,
        isPasscodeSet: updatedUser.isPasscodeSet,
      },
    };
  }

  //Login With Password

  async loginWithPassword(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { account: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new RpcException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new RpcException('Please verify your email first');
    }

    return {
      message: 'Login successful',
      data: {
        name: user.name,
        email: user.email,
        accountNumber: user.accountNumber,
        balance: user.account.balance,
        isPasscodeSet: user.isPasscodeSet,
      },
    };
  }

  //Login with Passcode

  async loginWithPasscode(email: string, passcode: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { account: true },
    });

    if (!user) {
      throw new RpcException('User not found');
    }

    if (!user.isEmailVerified) {
      throw new RpcException('Please verify your email first');
    }

    if (!user.isPasscodeSet) {
      throw new RpcException(
        'No passcode set. Please login with password first.',
      );
    }

    // Check if account is locked
    if (user.passcodeLockedUntil && user.passcodeLockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.passcodeLockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new RpcException(
        `Account locked. Try again after ${remainingMinutes} minutes`,
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
      throw new RpcException(
        `Invalid passcode. ${remainingAttempts} attempts remaining`,
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

    return {
      message: 'Login successful',
      data: {
        name: user.name,
        email: user.email,
        accountNumber: user.accountNumber,
        balance: user.account.balance,
        isPasscodeSet: user.isPasscodeSet,
      },
    };
  }

  //Update Passcode

  async updatePasscode(
    email: string,
    oldPasscode: string,
    newPasscode: string,
  ) {
    // Validate new passcode (6 digits)
    if (!/^\d{6}$/.test(newPasscode)) {
      throw new RpcException('New passcode must be 6 digits');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcException('User not found');
    }

    if (!user.isPasscodeSet) {
      throw new RpcException('No passcode set');
    }

    const isPasscodeValid = await bcrypt.compare(oldPasscode, user.passcode);

    if (!isPasscodeValid) {
      throw new RpcException('Invalid current passcode');
    }

    const hashedNewPasscode = await bcrypt.hash(newPasscode, 10);

    await this.prisma.user.update({
      where: { email },
      data: {
        passcode: hashedNewPasscode,
        passcodeSetAt: new Date(),
      },
    });

    return {
      message: 'Passcode updated successfully',
    };
  }

  //Disable Passcode

  async disablePasscode(email: string, passcode: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcException('User not found');
    }

    if (!user.isPasscodeSet) {
      throw new RpcException('No passcode set');
    }

    const isPasscodeValid = await bcrypt.compare(passcode, user.passcode);

    if (!isPasscodeValid) {
      throw new RpcException('Invalid passcode');
    }

    await this.prisma.user.update({
      where: { email },
      data: {
        passcode: null,
        isPasscodeSet: false,
        passcodeSetAt: null,
      },
    });

    return {
      message: 'Passcode disabled successfully',
    };
  }

  //Forgot Password

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcException('User not found');
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
    await this.emailService.sendResetPasswordEmail(email, user.name, resetCode);

    return {
      message: 'Password reset code sent to your email',
    };
  }

  //Reset Password

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcException('User not found');
    }

    if (user.otpCode !== code) {
      throw new RpcException('Invalid reset code');
    }

    if (user.otpExpiresAt < new Date()) {
      throw new RpcException('Reset code expired');
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

    return {
      message: 'Password reset successful',
    };
  }
}
