import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get('EMAIL_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });

    // Verify SMTP connection on startup
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email service connection failed:', error);
      } else {
        this.logger.log('Email service is ready to send emails');
      }
    });
  }

  async sendOtpEmail(email: string, name: string, otp: string) {
    const mailOptions = {
      from: `"FinTech Wallet" <${this.configService.get('EMAIL_USER')}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Welcome To FinTech Wallet! 🎉</h2>
          <p style="color: #666; font-size: 16px;">Hello ${name},</p>
          <p style="color: #666; font-size: 16px;">Thank you for signing up. Please verify your email address by entering the code below:</p>
          
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #333;">${otp}</span>
          </div>
          
          <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
          <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="color: #999; font-size: 12px; text-align: center;">FinTech Wallet - Secure Digital Banking</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasscodeSetupEmail(
    email: string,
    name: string,
    accountNumber: string,
  ) {
    const mailOptions = {
      from: `"FinTech Wallet" <${this.configService.get('EMAIL_USER')}>`,
      to: email,
      subject: 'Welcome to FinTech Wallet - Setup Your Passcode',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Welcome to FinTech Wallet! 🎉</h2>
          <p style="color: #666; font-size: 16px;">Hello ${name},</p>
          <p style="color: #666; font-size: 16px;">Your email has been verified successfully!</p>
          <p style="color: #666; font-size: 16px;">Please open the FinTech Wallet app to set up your 6-digit passcode for quick and secure access.</p>
          
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <p style="color: #666; font-size: 14px; margin: 0;">Your account number: <strong>${accountNumber}</strong></p>
          </div>
          
          <p style="color: #666; font-size: 14px;">Stay secure and enjoy seamless banking! 💰</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="color: #999; font-size: 12px; text-align: center;">FinTech Wallet - Secure Digital Banking</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendResetPasswordEmail(email: string, name: string, otp: string) {
    const mailOptions = {
      from: `"FinTech Wallet" <${this.configService.get('EMAIL_USER')}>`,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Welcome To FinTech Wallet! 🎉</h2>
          <p style="color: #666; font-size: 16px;">Hello ${name},</p>
          <p style="color: #666; font-size: 16px;">Please Reset your password by entering the code below:</p>
          
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #333;">${otp}</span>
          </div>
          
          <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
          <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="color: #999; font-size: 12px; text-align: center;">FinTech Wallet - Secure Digital Banking</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
