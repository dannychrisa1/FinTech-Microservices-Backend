import { Controller, Get, Inject } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Controller()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
     @Inject('ACCOUNT_SERVICE') private accountClient: ClientProxy,
  ) {}

  @MessagePattern('initialize-payment')
  initialize(@Payload() payload: { email: string; amount: number }) {
    return this.paymentService.initializePayment(payload.email, payload.amount);
  }

  @MessagePattern('verify-payment')
  verify(@Payload() payload: { reference: string; email:string }) {
    return this.paymentService.verifyAndDeposit(payload.reference, payload.email);
  }

  //Method to handle Payment webhooks
  // @MessagePattern('handle-payment-webhook')
  // async handlePaymentWebhook(@Payload() payload:any){
  //   const { reference } = payload;

  //   //Verify the payment with paystack
  //   const verification = await this.paymentService.verifyPayment(reference);

  //   if(verification.data.status === 'success'){
  //     const { email, amount } = verification.data.metadata || {};

  //     //Call account Service to deposit the money

  //     const depositResult = await lastValueFrom(
  //        this.accountClient.send('deposit-from-payment', {
  //         email: verification.data.customer.email,
  //         amount:verification.data.amount / 100, //conert from kobo to naira
  //         reference,
  //     })
  //     );
  //     return {
  //       status: true,
  //       message: `Payment processsed succesfully`,
  //       data:  depositResult,
  //     };
  //   }

  //   return {
  //     status: false,
  //     message: `Payment verification failed`,
  //   }

  // }
}
