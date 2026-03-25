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
    // Debug log to verify the key is loaded
    console.log(
      'Paystack secret loaded:',
      this.paystackSecret
        ? `Yes (${this.paystackSecret.substring(0, 10)}...)`
        : 'No',
    );
  }

  //Initialize a payment

  async initializePayment(email: string, amount: number) {
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
      return response.data;
    } catch (err: any) {
      console.error(
        'Paystack initialization error:',
        err.response?.data || err.message,
      );
      throw new RpcException(
        err.response?.data || 'Payment initialization failed',
      );
    }
  }

  //Verify payment
  async verifyAndDeposit(reference: string) {
    try {
      // 1. Verify the payment with Paystack
      const verification = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecret}`,
          },
        },
      );

      const paymentData = verification.data;

      if (paymentData.data.status !== 'success') {
        throw new RpcException('Payment verification failed');
      }

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
          amount: paymentData.data.amount / 100, // Convert from kobo to naira
          reference: reference,
        }),
      );

      console.log('✅ Deposit successful:', depositResult);

      return {
        status: true,
        message: 'Payment verified and deposited successfully',
        data: {
          payment: paymentData.data,
          deposit: depositResult,
        },
      };
    } catch (err: any) {
      console.error('Error in verifyAndDeposit:', err);
      if (err.response?.data) {
        throw new RpcException(err.response.data);
      }
      throw new RpcException(
        err.message || 'Payment verification and deposit failed',
      );
    }
  }
}
