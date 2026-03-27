import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailtrapClient } from 'mailtrap';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: MailtrapClient;
  private readonly senderEmail: string;

  constructor(private configService: ConfigService) {
    const token = this.configService.get('MAILTRAP_API_TOKEN');
    this.senderEmail = this.configService.get('MAILTRAP_SENDER_EMAIL') || 'hello@demomailtrap.co';
    
    if (!token) {
      this.logger.error('MAILTRAP_API_TOKEN is not set in environment variables');
    }
    
    this.client = new MailtrapClient({ token });
    this.logger.log('Mailtrap email service initialized');
  }

  async sendOtpEmail(email: string, name: string, otp: string) {
    try {
      await this.client.send({
        from: { email: this.senderEmail, name: 'FinTech Wallet' },
        to: [{ email }],
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
        category: 'OTP Verification',
      });
      this.logger.log(`OTP email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}: ${error.message}`);
      throw error;
    }
  }

  async sendPasscodeSetupEmail(email: string, name: string, accountNumber: string) {
    try {
      await this.client.send({
        from: { email: this.senderEmail, name: 'FinTech Wallet' },
        to: [{ email }],
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
        category: 'Welcome Email',
      });
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}: ${error.message}`);
      throw error;
    }
  }

  async sendResetPasswordEmail(email: string, name: string, otp: string) {
    try {
      await this.client.send({
        from: { email: this.senderEmail, name: 'FinTech Wallet' },
        to: [{ email }],
        subject: 'Reset Your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
            <p style="color: #666; font-size: 16px;">Hello ${name},</p>
            <p style="color: #666; font-size: 16px;">Please reset your password by entering the code below:</p>
            
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <span style="font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #333;">${otp}</span>
            </div>
            
            <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; text-align: center;">FinTech Wallet - Secure Digital Banking</p>
          </div>
        `,
        category: 'Password Reset',
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${email}: ${error.message}`);
      throw error;
    }
  }
}