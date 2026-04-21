import { RpcCustomException } from '@app/common';
import { ApiResponse } from '@app/common/dto/api-response.dto';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import axios from 'axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PaymentService {
  private paystackSecret: string;
  constructor(
    private configService: ConfigService,
    @Inject('ACCOUNT_SERVICE') private accountClient: ClientProxy,
  ) {
    this.paystackSecret = this.configService.get<string>('PAYSTACK_SECRET');
  }

  //Initialize a payment

  async initializePayment(email: string, amount: number) {
    // Validate input first
    if (!email || !email.includes('@')) {
      throw new RpcCustomException('Valid email is required', 400);
    }

    if (!amount || amount <= 0) {
      throw new RpcCustomException('Amount must be greater than 0', 400);
    }
    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: amount * 100, // convert to kobo
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecret}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const paymentData = response.data;

      return ApiResponse.success(
        {
          authorizationUrl: paymentData.data.authorization_url,
          reference: paymentData.data.reference,
          accessCode: paymentData.data.access_code,
          email: email,
          amount: amount,
          currency: 'NGN',
          expiresIn: 3600, // 1 hour in seconds
        },
        'Payment initilized successfully',
      );
    } catch (err: any) {
      // Handle different error types
      if (err.code === 'ECONNABORTED') {
        // Timeout error
        throw new RpcCustomException(
          'Payment service timeout. Please try again',
          504,
        );
      }

      if (err.response?.status === 401) {
        // Authentication error with Paystack
        throw new RpcCustomException(
          'Payment service authentication failed',
          502,
        );
      }

      if (err.response?.status === 429) {
        // Rate limited
        throw new RpcCustomException(
          'Too many requests. Please try again later',
          429,
        );
      }

      if (err.response?.status >= 500) {
        // Paystack server error
        throw new RpcCustomException(
          'Payment service is temporarily unavailable',
          502,
        );
      }

      // Handle Paystack's validation errors
      if (err.response?.data?.message) {
        throw new RpcCustomException(err?.response?.data?.message, 400);
      }

      // Default error
      throw new RpcCustomException(
        err.response?.data || 'Payment initialization failed',
        400,
      );
    }
  }

  //Verify payment
  async verifyAndDeposit(reference: string, email: string) {
    // Validate input
    if (!reference) {
      throw new RpcCustomException('Payment reference is required', 400);
    }

    if (!email) {
      throw new RpcCustomException('Email is required', 400);
    }

    try {
      // Verify the payment with Paystack
      const verification = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecret}`,
          },
          timeout: 30000,
        },
      );

      const paymentData = verification.data;

      // Payment status not successful
      if (paymentData.data.status !== 'success') {
        throw new RpcCustomException(
          `Payment verification failed. Status: ${paymentData.data.status}`,
          400,
        );
      }

      // Payment doesn't belong to this user
      if (paymentData.data.customer.email !== email) {
        throw new RpcCustomException(
          'Payment does not belong to this user',
          403,
        );
      }

      // Check if payment was already processed (idempotency)
    

      console.log('✅ Payment verified successfully!');
      console.log('Payment details:', {
        reference: reference,
        email: paymentData.data.customer.email,
        amount: paymentData.data.amount / 100,
      });

      // 2. Call account service to deposit money
      const depositResult = await lastValueFrom(
        this.accountClient.send('deposit-from-payment', {
          email: paymentData.data.customer.email,
          amount: paymentData.data.amount / 100,
          reference: reference,
        }),
      );

      console.log('✅ Deposit successful:', depositResult);

      const depositData = depositResult.data || depositResult;

      return ApiResponse.success(
        {
          paymentReference: reference,
          transactionStatus: paymentData.data.status,
          paymentMethod: paymentData.data.channel,
          amountPaid: paymentData.data.amount / 100,
          currency: paymentData.data.currency,
          customer: {
            email: paymentData.data.customer.email,
            name: depositData.name || null,
          },
          depositDetails: {
            accountNumber: depositData.accountNumber,
            balance: depositData.balance,
            amountDeposited: depositData.amountDeposited,
          },
          paidAt: paymentData.data.paidAt,
          transactionDate: new Date().toISOString(),
        },
        'Payment verified and deposited successfully',
      );
    } catch (err: any) {
      console.error('Error in verifyAndDeposit:', err);

      // Handle timeout
      if (err.code === 'ECONNABORTED') {
        throw new RpcCustomException(
          'Payment verification timeout. Please try again',
          504,
        );
      }

      // Handle network errors
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        throw new RpcCustomException('Payment service unavailable', 503);
      }

      // Handle Paystack API errors
      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message;

        if (status === 401) {
          throw new RpcCustomException(
            'Payment service authentication failed',
            502,
          );
        }

        if (status === 404) {
          throw new RpcCustomException('Payment reference not found', 404);
        }

        if (status === 429) {
          throw new RpcCustomException(
            'Too many requests. Please try again later',
            429,
          );
        }

        if (status >= 500) {
          throw new RpcCustomException(
            'Payment service is temporarily unavailable',
            502,
          );
        }

        // Paystack validation errors
        throw new RpcCustomException(
          message || 'Payment verification failed',
          status || 400,
        );
      }

      // Handle our own RpcCustomException (re-throw)
      if (err instanceof RpcCustomException) {
        throw err;
      }

      // Handle RpcException from account service
      if (err.message) {
        // Check for specific account service errors
        if (err.message.includes('already processed')) {
          throw new RpcCustomException('Payment already processed', 409);
        }

        if (err.message.includes('User not found')) {
          throw new RpcCustomException('User not found', 404);
        }

        if (err.message.includes('Account not found')) {
          throw new RpcCustomException('Account not found', 404);
        }

        throw new RpcCustomException(err.message, 400);
      }

      // Default error
      throw new RpcCustomException(
        'Payment verification and deposit failed',
        500,
      );
    }
  }
}
