import { Body, Controller, Headers, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { resourceLimits } from 'node:worker_threads';
import { lastValueFrom } from 'rxjs';

@Controller('payment')
export class PaymentController {
    constructor(
        @Inject('PAYMENT_SERVICE') private paymentClient: ClientProxy,
    ) {}

    //Initialize a Payment (get payStack authorization URL)
    @Post('initialize')
    @HttpCode(HttpStatus.OK)
    async initializePayment(@Body() body:{email:string; amount:number}){
        const result = await lastValueFrom(
            this.paymentClient.send('initialize-payment', body),
        );
        return result;
    }


    //Verify Payment after users complets payment on paystack

    @Post('verify')
    @HttpCode(HttpStatus.OK)
    async verifyPayment(@Body() body: {reference: string}){
        const result = await lastValueFrom(
            this.paymentClient.send('verify-payment', body),
        );
        return result;
    }

    //Webhook Endpoint

    // @Post('webhook')
    // @HttpCode(HttpStatus.OK)
    // async handleWebhook(@Body() body:any, @Headers('x-paystack-signature') signature:string){
    //     //Verify webhook signature(importand for security)
    //     const crypto = require('crypto');
    //     const secret = process.env.PAYSTACK_SECRET;
    //     const hash = crypto
    //         .createHmac('sha512', secret)
    //         .update(JSON.stringify(body))
    //         .digest('hex');

    //         if (hash !== signature){
    //             return { status:'error', message:'Invalid signature'}
    //         }

    //         //Handle Charge.success event
    //         if(body.event === 'charge.success'){

    //             const reference = body.data.reference;

    //             //Process the payment throuh microservice
    //             const result = await lastValueFrom(
    //                 this.paymentClient.send('handle-payment-webhook', {
    //                     reference
    //                 }),
    //             );

    //             return result;
    //         }

    //         return { status: 'recieved'};
    // }

}
